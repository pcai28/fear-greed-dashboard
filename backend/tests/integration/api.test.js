import request from "supertest";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.js";

const frontendFixture = resolve(import.meta.dirname, "../fixtures/frontend");

function dependencies(overrides = {}) {
  return {
    mongo: { close: vi.fn() },
    rateLimitStore: { increment: vi.fn().mockResolvedValue({ count: 1, resetAt: Date.now() + 60_000 }) },
    marketDataService: {
      get: vi.fn().mockResolvedValue({ range: "1Y", points: [], latest: {} })
    },
    waitlistService: {
      signup: vi.fn().mockResolvedValue({ ok: true, message: "Saved" })
    },
    ...overrides
  };
}

describe("Express API", () => {
  it("serves market data through the route", async () => {
    const deps = dependencies();
    const { app } = createApp({ dependencies: deps });
    const response = await request(app).get("/api/market-emotions?range=1M");
    expect(response.status).toBe(200);
    expect(deps.marketDataService.get).toHaveBeenCalledWith("1M");
  });

  it("serves waitlist signups through the route", async () => {
    const deps = dependencies();
    const { app } = createApp({ dependencies: deps, waitlistEnabled: true });
    const response = await request(app)
      .post("/api/waitlist")
      .send({ email: "a@example.com", consent: true });
    expect(response.status).toBe(200);
    expect(deps.waitlistService.signup).toHaveBeenCalledWith({
      email: "a@example.com",
      consent: true
    });
  });

  it("keeps waitlist collection closed by default", async () => {
    const logger = { error: vi.fn() };
    const { app } = createApp({ dependencies: dependencies(), logger });
    const response = await request(app)
      .post("/api/waitlist")
      .send({ email: "a@example.com", consent: true });
    expect(response.status).toBe(503);
    expect(response.body.error).toBe("The waitlist is not accepting signups yet.");
  });

  it("returns API 404 as JSON", async () => {
    const { app } = createApp({ dependencies: dependencies() });
    const response = await request(app).get("/api/missing");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Not found.");
  });

  it("does not rate-limit page or static asset requests", async () => {
    const deps = dependencies();
    const { app } = createApp({ dependencies: deps });
    const response = await request(app).get("/favicon.svg");
    expect(response.status).toBe(404);
    expect(deps.rateLimitStore.increment).not.toHaveBeenCalled();
    expect(response.headers["x-ratelimit-limit"]).toBeUndefined();
  });

  it("serves the terms page through the production frontend route", async () => {
    const deps = dependencies();
    const { app } = createApp({
      dependencies: deps,
      serveFrontend: true,
      frontendDist: frontendFixture
    });
    const response = await request(app).get("/terms");
    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-cache");
    expect(response.text).toContain("<h1>Terms of Use</h1>");
    expect(deps.rateLimitStore.increment).not.toHaveBeenCalled();
  });

  it("exposes an unthrottled Railway healthcheck", async () => {
    const deps = dependencies();
    const { app } = createApp({ dependencies: deps });
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(deps.rateLimitStore.increment).not.toHaveBeenCalled();
  });

  it("returns 429 when the rate-limit store exceeds the limit", async () => {
    const rateLimitStore = {
      increment: vi.fn().mockResolvedValue({ count: 61, resetAt: Date.now() + 60_000 })
    };
    const { app } = createApp({ dependencies: dependencies({ rateLimitStore }) });
    const response = await request(app).get("/api/market-emotions");
    expect(response.status).toBe(429);
    expect(response.headers["x-ratelimit-limit"]).toBe("60");
  });

  it("limits waitlist submissions to three per minute without consuming the global scope", async () => {
    const counts = new Map();
    const rateLimitStore = {
      increment: vi.fn(async (identifier) => {
        const count = (counts.get(identifier) || 0) + 1;
        counts.set(identifier, count);
        return { count, resetAt: Date.now() + 60_000 };
      })
    };
    const deps = dependencies({ rateLimitStore });
    const { app } = createApp({ dependencies: deps, waitlistEnabled: true });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await request(app)
        .post("/api/waitlist")
        .send({ email: `user${attempt}@example.com`, consent: true });
      expect(response.status).toBe(200);
      expect(response.headers["x-ratelimit-limit"]).toBe("3");
      expect(response.headers["x-ratelimit-remaining"]).toBe(String(2 - attempt));
    }

    const blocked = await request(app)
      .post("/api/waitlist")
      .send({ email: "blocked@example.com", consent: true });
    expect(blocked.status).toBe(429);
    expect(blocked.headers["x-ratelimit-limit"]).toBe("3");
    expect(blocked.headers["x-ratelimit-remaining"]).toBe("0");
    expect(Number(blocked.headers["retry-after"])).toBeGreaterThan(0);
    expect(deps.waitlistService.signup).toHaveBeenCalledTimes(3);

    const marketResponse = await request(app).get("/api/market-emotions");
    expect(marketResponse.status).toBe(200);
    expect(marketResponse.headers["x-ratelimit-limit"]).toBe("60");

    const identifiers = rateLimitStore.increment.mock.calls.map(([identifier]) => identifier);
    expect(identifiers[0]).not.toBe(identifiers[1]);
    expect(identifiers[0]).toBe(identifiers[2]);
    expect(identifiers[1]).toBe(identifiers[3]);
    expect(new Set(identifiers)).toHaveLength(2);
  });

  it("uses a hashed client identifier and ignores an untrusted forwarded IP", async () => {
    const deps = dependencies();
    const { app } = createApp({ dependencies: deps });
    await request(app).get("/api/market-emotions").set("x-forwarded-for", "203.0.113.9");
    const identifier = deps.rateLimitStore.increment.mock.calls[0][0];
    expect(identifier).toMatch(/^[a-f0-9]{64}$/);
    expect(identifier).not.toContain("203.0.113.9");
  });

  it("hashes a validated Railway client IP without storing the raw header", async () => {
    const first = dependencies();
    const second = dependencies();
    const firstApp = createApp({ dependencies: first, clientIpHeader: "x-real-ip" }).app;
    const secondApp = createApp({ dependencies: second, clientIpHeader: "x-real-ip" }).app;
    await request(firstApp).get("/api/market-emotions").set("x-real-ip", "203.0.113.10");
    await request(secondApp).get("/api/market-emotions").set("x-real-ip", "203.0.113.11");
    const firstIdentifier = first.rateLimitStore.increment.mock.calls[0][0];
    const secondIdentifier = second.rateLimitStore.increment.mock.calls[0][0];
    expect(firstIdentifier).toMatch(/^[a-f0-9]{64}$/);
    expect(firstIdentifier).not.toContain("203.0.113.10");
    expect(firstIdentifier).not.toBe(secondIdentifier);
  });

  it("falls back safely when the configured client IP header is malformed", async () => {
    const deps = dependencies();
    const { app } = createApp({ dependencies: deps, clientIpHeader: "x-real-ip" });
    await request(app).get("/api/market-emotions").set("x-real-ip", "not-an-ip");
    expect(deps.rateLimitStore.increment.mock.calls[0][0]).toMatch(/^[a-f0-9]{64}$/);
  });

  it("sets the production security-header baseline", async () => {
    const { app } = createApp({ dependencies: dependencies(), isProduction: true });
    const response = await request(app).get("/api/market-emotions");
    expect(response.headers["content-security-policy"]).toContain("script-src 'self'");
    expect(response.headers["content-security-policy"]).toContain("script-src-attr 'none'");
    expect(response.headers["content-security-policy"]).toContain("img-src 'self' data: blob:");
    expect(response.headers["content-security-policy"]).toContain("form-action 'self'");
    expect(response.headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(response.headers["content-security-policy"]).toContain("upgrade-insecure-requests");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("DENY");
    expect(response.headers["referrer-policy"]).toBe("no-referrer");
    expect(response.headers["cross-origin-opener-policy"]).toBe("same-origin");
    expect(response.headers["cross-origin-resource-policy"]).toBe("same-origin");
    expect(response.headers["permissions-policy"]).toBe(
      "camera=(), geolocation=(), microphone=(), payment=(), usb=()"
    );
    expect(response.headers["strict-transport-security"]).toBe("max-age=31536000");
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  it("does not send HSTS during local HTTP development", async () => {
    const { app } = createApp({ dependencies: dependencies(), isProduction: false });
    const response = await request(app).get("/health");
    expect(response.headers["strict-transport-security"]).toBeUndefined();
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("treats ambiguous range query values as invalid input", async () => {
    const deps = dependencies();
    const { app } = createApp({ dependencies: deps });
    await request(app).get("/api/market-emotions?range=1M&range=5Y");
    expect(deps.marketDataService.get).toHaveBeenCalledWith("1Y");
  });

  it("does not expose internal error details in production", async () => {
    const logger = { error: vi.fn() };
    const deps = dependencies({
      marketDataService: { get: vi.fn().mockRejectedValue(new Error("mongodb://secret")) }
    });
    const { app } = createApp({ dependencies: deps, isProduction: true, logger });
    const response = await request(app).get("/api/market-emotions");
    expect(response.status).toBe(502);
    expect(response.body.detail).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain("mongodb://secret");
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain("mongodb://secret");
  });
});
