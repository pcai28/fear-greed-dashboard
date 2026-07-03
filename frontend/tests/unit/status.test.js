import { describe, expect, it } from "vitest";
import { fearState, vixState } from "../../src/features/gauges/status.js";

describe("gauge states", () => {
  it("maps Fear & Greed values", () => {
    expect(fearState(25)).toBe("extreme-fear");
    expect(fearState(35)).toBe("fear");
    expect(fearState(76)).toBe("extreme-greed");
  });

  it("maps VIX values", () => {
    expect(vixState(14.9)).toBe("calm");
    expect(vixState(15)).toBe("moderate");
    expect(vixState(30)).toBe("moderate");
    expect(vixState(30.01)).toBe("significant");
  });
});
