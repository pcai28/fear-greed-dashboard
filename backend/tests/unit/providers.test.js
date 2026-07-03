import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { createCnnFearGreedProvider } from "../../src/providers/cnn-fear-greed.js";
import { createYahooVixProvider } from "../../src/providers/yahoo-vix.js";

describe("market providers", () => {
  it("normalizes Yahoo VIX chart data", async () => {
    const fixture = JSON.parse(
      await readFile(new URL("../fixtures/yahoo-vix.json", import.meta.url), "utf8")
    );
    const provider = createYahooVixProvider({ fetchJson: vi.fn().mockResolvedValue(fixture) });
    const result = await provider({ yahooRange: "1y", yahooInterval: "1d" });
    expect(result.latest.value).toBe(18.41);
    expect(result.points).toHaveLength(2);
  });

  it("normalizes CNN Fear & Greed data", async () => {
    const timestamp = Date.now();
    const provider = createCnnFearGreedProvider({
      fetchJson: vi.fn().mockResolvedValue({
        fear_and_greed: { score: 24.5, timestamp, rating: "extreme fear" },
        fear_and_greed_historical: { data: [{ x: timestamp, y: 24.5 }] }
      })
    });
    const result = await provider({ days: 2 });
    expect(result.latest).toMatchObject({ value: 24.5, status: "Extreme Fear" });
    expect(result.points).toHaveLength(1);
  });

  it("keeps the latest CNN point when a weekend puts it outside the rolling window", async () => {
    const fridayTimestamp = Date.now() - 52 * 60 * 60 * 1000;
    const provider = createCnnFearGreedProvider({
      fetchJson: vi.fn().mockResolvedValue({
        fear_and_greed: {
          score: 24.77,
          timestamp: fridayTimestamp,
          rating: "extreme fear"
        },
        fear_and_greed_historical: {
          data: [{ x: fridayTimestamp, y: 24.77 }]
        }
      })
    });
    const result = await provider({ days: 2 });
    expect(result.points).toEqual([
      { date: new Date(fridayTimestamp).toISOString(), value: 24.77 }
    ]);
  });
});
