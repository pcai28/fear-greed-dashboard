import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const chartStyles = readFileSync(resolve(import.meta.dirname, "../../src/styles/chart.css"), "utf8");
const tokens = readFileSync(resolve(import.meta.dirname, "../../src/styles/tokens.css"), "utf8");

describe("chart grid", () => {
  it("uses the canvas grid without a second CSS grid layer", () => {
    expect(chartStyles).toContain("background: var(--chart-bg)");
    expect(chartStyles).not.toContain("linear-gradient(var(--chart-line)");
    expect(tokens).not.toContain("--chart-line");
  });
});
