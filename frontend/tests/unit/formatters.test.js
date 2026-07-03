import { describe, expect, it } from "vitest";
import { formatDate, formatNumber } from "../../src/shared/formatters.js";

describe("formatters", () => {
  it("rejects invalid and non-finite values", () => {
    expect(formatNumber(Infinity)).toBe("--");
    expect(formatNumber("not-a-number")).toBe("--");
    expect(formatDate("not-a-date")).toBe("--");
  });

  it("preserves requested precision", () => {
    expect(formatNumber(16.3, 2)).toMatch(/16[.,]30/);
  });
});
