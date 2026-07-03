import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const markup = readFileSync(resolve(import.meta.dirname, "../../src/views/gauges.html"), "utf8");
const main = readFileSync(resolve(import.meta.dirname, "../../src/main.js"), "utf8");
const gaugeStyles = readFileSync(resolve(import.meta.dirname, "../../src/styles/gauges.css"), "utf8");
const metricStyles = readFileSync(resolve(import.meta.dirname, "../../src/styles/metrics.css"), "utf8");

describe("gauge SVG labels", () => {
  it("keeps qualitative and numeric labels inside each SVG", () => {
    expect(markup.match(/class="gauge-svg-ticks"/g)).toHaveLength(2);
    expect(markup.match(/class="gauge-svg-label" data-range=/g)).toHaveLength(10);
    expect(markup.match(/<text x=/g)).toHaveLength(9);
    expect(markup).not.toContain("gauge-number");
  });

  it("wraps long VIX labels across two curved paths without shrinking them", () => {
    const vixMarkup = markup.slice(markup.indexOf('id="vixGauge"'));
    expect(vixMarkup.match(/href="#vixLabelArc"/g)).toHaveLength(3);
    expect(vixMarkup.match(/href="#vixLabelArcInner"/g)).toHaveLength(2);
    expect(vixMarkup).toContain("MODERATE UNCERTAINTY");
    expect(vixMarkup).toContain("&amp; CAUTION");
    expect(vixMarkup).not.toContain("textLength");
  });

  it("uses the condensed semantic face for range labels and gauge status only", () => {
    expect(main).toContain('./styles/fonts.css');
    expect(gaugeStyles).toMatch(/\.gauge-svg-label\s*\{[^}]*font-family: var\(--font-gauge-semantic\)/s);
    expect(metricStyles).toMatch(/\.metric-status\s*\{[^}]*font-family: var\(--font-gauge-semantic\)/s);
    expect(gaugeStyles).not.toMatch(/\.gauge-svg-ticks\s*\{[^}]*font-family: var\(--font-gauge-semantic\)/s);
  });
});
