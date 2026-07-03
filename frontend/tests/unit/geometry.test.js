import { describe, expect, it } from "vitest";
import { createPlot, roundedRange, yFor } from "../../src/features/chart/geometry.js";

describe("chart geometry", () => {
  it("creates padded rounded ranges", () => {
    expect(roundedRange([15, 20, 25], 40)).toEqual({ min: 10, max: 30 });
  });

  it("places exact threshold values on the selected axis", () => {
    const plot = createPlot({ width: 1000, height: 500 });
    expect(yFor(25, plot, { min: 0, max: 100 })).toBe(plot.bottom - plot.height * 0.25);
    expect(yFor(30, plot, { min: 10, max: 50 })).toBe(plot.bottom - plot.height * 0.5);
  });
});
