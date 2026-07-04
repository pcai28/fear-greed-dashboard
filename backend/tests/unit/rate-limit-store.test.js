import { describe, expect, it, vi } from "vitest";
import { createRateLimitStore } from "../../src/stores/rate-limit.js";

function memoryStore(windowMs = 60_000) {
  return createRateLimitStore({ redis: { enabled: false }, windowMs });
}

describe("sliding-window rate-limit store", () => {
  it("slides across fixed-window boundaries and evicts old events", async () => {
    const store = memoryStore(60_000);
    await store.increment("global", { limit: 3, now: 59_999 });
    await store.increment("global", { limit: 3, now: 60_000 });
    await store.increment("global", { limit: 3, now: 60_001 });

    await expect(store.increment("global", { limit: 3, now: 60_002 })).resolves.toEqual({
      allowed: false,
      count: 3,
      resetAt: 119_999
    });
    await expect(store.increment("global", { limit: 3, now: 120_000 })).resolves.toEqual({
      allowed: true,
      count: 2,
      resetAt: 120_001
    });
  });

  it("does not let rejected requests extend the reset time", async () => {
    const store = memoryStore(1_000);
    await store.increment("client", { limit: 1, now: 100 });
    const first = await store.increment("client", { limit: 1, now: 200 });
    const second = await store.increment("client", { limit: 1, now: 900 });
    expect(first).toEqual({ allowed: false, count: 1, resetAt: 1_100 });
    expect(second).toEqual(first);
  });

  it("keeps independently scoped identifiers isolated", async () => {
    const store = memoryStore();
    await store.increment("global-hmac", { limit: 1, now: 1_000 });
    await expect(store.increment("global-hmac", { limit: 1, now: 1_001 })).resolves.toMatchObject({
      allowed: false
    });
    await expect(store.increment("waitlist-hmac", { limit: 1, now: 1_001 })).resolves.toMatchObject({
      allowed: true,
      count: 1
    });
  });

  it("uses one atomic Redis script and falls back to memory on failure", async () => {
    const command = vi.fn().mockRejectedValue(new Error("offline"));
    const logger = { warn: vi.fn() };
    const store = createRateLimitStore({ redis: { enabled: true, command }, windowMs: 60_000, logger });
    await expect(store.increment("scope", { limit: 2, now: 1_000 })).resolves.toMatchObject({
      allowed: true,
      count: 1
    });
    expect(command.mock.calls[0][0][0]).toBe("EVAL");
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
