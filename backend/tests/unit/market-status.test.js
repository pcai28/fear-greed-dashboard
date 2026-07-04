import { describe, expect, it } from "vitest";
import { fearGreedStatus, vixStatus } from "../../src/domain/market-status.js";

describe("market status boundaries", () => {
  it("maps Fear & Greed thresholds", () => {
    expect(fearGreedStatus(25)).toBe("Extreme Fear");
    expect(fearGreedStatus(26)).toBe("Fear");
    expect(fearGreedStatus(45)).toBe("Fear");
    expect(fearGreedStatus(46)).toBe("Neutral");
    expect(fearGreedStatus(55)).toBe("Neutral");
    expect(fearGreedStatus(56)).toBe("Greed");
    expect(fearGreedStatus(75)).toBe("Greed");
    expect(fearGreedStatus(76)).toBe("Extreme Greed");
  });

  it("maps VIX thresholds", () => {
    expect(vixStatus(14.99)).toBe("Calm & Stable");
    expect(vixStatus(15)).toBe("Moderate Uncertainty & Caution");
    expect(vixStatus(30)).toBe("Moderate Uncertainty & Caution");
    expect(vixStatus(30.01)).toBe("Significant Fear & Uncertainty");
  });

  it("falls back for missing and invalid values", () => {
    expect(fearGreedStatus(null)).toBe("Unavailable");
    expect(fearGreedStatus(Number.NaN)).toBe("Unavailable");
    expect(vixStatus(undefined)).toBe("Unavailable");
    expect(vixStatus("invalid")).toBe("Unavailable");
  });
});
