import { describe, expect, it, vi } from "vitest";
import { createMarketDataService } from "../../src/services/market-data.js";

const sourceResult = {
  latest: { value: 20, date: "2026-06-25T00:00:00.000Z", status: "status" },
  points: [{ date: "2026-06-25T00:00:00.000Z", value: 20 }]
};

describe("market data service", () => {
  it("returns a fresh cache entry without fetching providers", async () => {
    const payload = { range: "1Y" };
    const cache = { read: vi.fn().mockResolvedValue({ payload }), isFresh: () => true };
    const fetchVix = vi.fn();
    const service = createMarketDataService({ cache, fetchVix, fetchFearGreed: vi.fn() });
    expect(await service.get("1Y")).toBe(payload);
    expect(fetchVix).not.toHaveBeenCalled();
  });

  it("writes provider data to the cache", async () => {
    const cache = {
      read: vi.fn().mockResolvedValue(null),
      isFresh: () => false,
      write: vi.fn().mockResolvedValue()
    };
    const service = createMarketDataService({
      cache,
      fetchVix: vi.fn().mockResolvedValue(sourceResult),
      fetchFearGreed: vi.fn().mockResolvedValue(sourceResult)
    });
    const result = await service.get("1M");
    expect(result.range).toBe("1M");
    expect(result.isStale).toBe(false);
    expect(cache.write).toHaveBeenCalledTimes(2);
    expect(cache.write).toHaveBeenCalledWith("market:latest", expect.any(Object));
    expect(cache.write).toHaveBeenCalledWith("market:1M", expect.any(Object));
  });

  it("uses one canonical latest snapshot for every historical range", async () => {
    const canonicalLatest = {
      updatedAt: "2026-07-01T19:14:00.000Z",
      lastSuccessfulUpdate: "2026-07-01T19:14:00.000Z",
      isStale: false,
      latest: {
        vix: { value: 16.28, date: "2026-07-01T19:14:00.000Z" },
        fearGreed: { value: 52, date: "2026-07-01T19:00:00.000Z" }
      }
    };
    const entries = {
      "market:latest": { payload: canonicalLatest },
      "market:1D": {
        payload: {
          range: "1D",
          latest: { vix: { value: 16.1 }, fearGreed: { value: 51 } },
          points: [{ date: sourceResult.points[0].date, vix: 16.1, fearGreed: 51 }]
        }
      },
      "market:1Y": {
        payload: {
          range: "1Y",
          latest: { vix: { value: 16.3 }, fearGreed: { value: 53 } },
          points: [{ date: sourceResult.points[0].date, vix: 16.3, fearGreed: 53 }]
        }
      }
    };
    const cache = {
      read: vi.fn((key) => Promise.resolve(entries[key] ?? null)),
      isFresh: () => true
    };
    const service = createMarketDataService({
      cache,
      fetchVix: vi.fn(),
      fetchFearGreed: vi.fn()
    });

    const oneDay = await service.get("1D");
    const oneYear = await service.get("1Y");
    expect(oneDay.latest).toEqual(canonicalLatest.latest);
    expect(oneYear.latest).toEqual(canonicalLatest.latest);
    expect(oneDay.updatedAt).toBe(canonicalLatest.updatedAt);
    expect(oneYear.updatedAt).toBe(canonicalLatest.updatedAt);
  });

  it("refreshes a fresh 1D cache that is missing the Fear & Greed series", async () => {
    const payload = {
      range: "1D",
      latest: { fearGreed: { value: 24.77 } },
      points: [{ date: sourceResult.points[0].date, vix: 18, fearGreed: null }]
    };
    const cache = {
      read: vi.fn().mockResolvedValue({ payload }),
      isFresh: () => true,
      write: vi.fn().mockResolvedValue()
    };
    const fetchVix = vi.fn().mockResolvedValue(sourceResult);
    const service = createMarketDataService({
      cache,
      fetchVix,
      fetchFearGreed: vi.fn().mockResolvedValue(sourceResult)
    });
    const result = await service.get("1D");
    expect(fetchVix).toHaveBeenCalledOnce();
    expect(result.points[0].fearGreed).toBe(20);
  });

  it("returns stale data without exposing provider error details", async () => {
    const sensitiveError = "mongodb://user:password@internal.example/market";
    const payload = { range: "1Y", isStale: false };
    const cache = { read: vi.fn().mockResolvedValue({ payload }), isFresh: () => false };
    const service = createMarketDataService({
      cache,
      fetchVix: vi.fn().mockRejectedValue(new Error(sensitiveError)),
      fetchFearGreed: vi.fn()
    });
    const result = await service.get("1Y");
    expect(result).toMatchObject({
      range: "1Y",
      isStale: true,
      staleReason: "provider_refresh_failed"
    });
    expect(JSON.stringify(result)).not.toContain(sensitiveError);
  });
});
