import { describe, expect, it } from "vitest";
import { nextPointIndex } from "../../src/features/chart/renderer.js";
import { describePoint, indexForClientX } from "../../src/features/chart/tooltip.js";

describe("chart accessibility", () => {
  it("moves through historical points with keyboard commands", () => {
    expect(nextPointIndex("Home", 3, 5)).toBe(0);
    expect(nextPointIndex("End", 1, 5)).toBe(4);
    expect(nextPointIndex("ArrowLeft", 0, 5)).toBe(0);
    expect(nextPointIndex("ArrowRight", 4, 5)).toBe(4);
    expect(nextPointIndex("Escape", 2, 5)).toBeNull();
  });

  it("maps pointer positions to bounded chart points", () => {
    const rect = { left: 100 };
    const plot = { left: 50, right: 450, width: 400 };
    expect(indexForClientX(150, rect, plot, 5)).toBe(0);
    expect(indexForClientX(350, rect, plot, 5)).toBe(2);
    expect(indexForClientX(90, rect, plot, 5)).toBeNull();
  });

  it("creates a complete spoken description", () => {
    const text = describePoint(
      { date: "2026-06-30T12:00:00Z", fearGreed: 31, vix: 16.32 },
      "1Y"
    );
    expect(text).toContain("Fear and Greed 31.0");
    expect(text).toContain("VIX 16.32");
  });
});
