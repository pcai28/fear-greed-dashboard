import { describe, expect, it } from "vitest";
import { alignSeries } from "../../src/domain/align-series.js";

describe("alignSeries", () => {
  it("joins daily values by date", () => {
    const vix = [{ date: "2026-06-25T20:00:00.000Z", value: 18 }];
    const fear = [{ date: "2026-06-25T00:00:00.000Z", value: 42 }];
    expect(alignSeries(vix, fear, "1Y")).toEqual([
      { date: vix[0].date, vix: 18, fearGreed: 42 }
    ]);
  });

  it("uses the nearest Fear & Greed trading day within three days", () => {
    const vix = [{ date: "2026-06-28T00:00:00.000Z", value: 20 }];
    const fear = [{ date: "2026-06-26T00:00:00.000Z", value: 30 }];
    expect(alignSeries(vix, fear, "5D")[0].fearGreed).toBe(30);
  });
});
