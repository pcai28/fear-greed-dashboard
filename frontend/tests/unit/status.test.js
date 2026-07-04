import { describe, expect, it } from "vitest";
import { fearState, vixState } from "../../src/features/gauges/status.js";

describe("gauge states", () => {
  it("maps Fear & Greed values", () => {
    expect(fearState(25)).toBe("extreme-fear");
    expect(fearState(26)).toBe("fear");
    expect(fearState(45)).toBe("fear");
    expect(fearState(46)).toBe("neutral");
    expect(fearState(55)).toBe("neutral");
    expect(fearState(56)).toBe("greed");
    expect(fearState(75)).toBe("greed");
    expect(fearState(76)).toBe("extreme-greed");
  });

  it("maps VIX values", () => {
    expect(vixState(14.9)).toBe("calm");
    expect(vixState(15)).toBe("moderate");
    expect(vixState(30)).toBe("moderate");
    expect(vixState(30.01)).toBe("significant");
  });

  it("uses safe states for missing and invalid values", () => {
    expect(fearState(null)).toBe("neutral");
    expect(fearState(Number.NaN)).toBe("neutral");
    expect(vixState(undefined)).toBe("moderate");
    expect(vixState("invalid")).toBe("moderate");
  });
});
