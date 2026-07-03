import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const gauges = readFileSync(resolve(import.meta.dirname, "../../src/views/gauges.html"), "utf8");
const chart = readFileSync(resolve(import.meta.dirname, "../../src/views/chart.html"), "utf8");
const dialog = readFileSync(resolve(import.meta.dirname, "../../src/views/share.html"), "utf8");

describe("share interface markup", () => {
  it("provides separate gauge and line-chart share entry points", () => {
    expect(gauges).toContain('data-share-kind="gauges"');
    expect(chart).toContain('data-share-kind="line-chart"');
  });

  it("provides X, Threads, Facebook, Reddit, and icon-only PNG save actions", () => {
    expect(dialog).toContain('aria-label="Save PNG"');
    expect(dialog).toContain('data-share-platform="x"');
    expect(dialog).toContain('data-share-platform="threads"');
    expect(dialog).toContain('data-brand-icon="threads"');
    expect(dialog).toContain('viewBox="0 0 976.98 1082"');
    expect(dialog).toContain('data-share-platform="facebook"');
    expect(dialog).toContain('data-share-platform="reddit"');
    expect(dialog.match(/data-share-platform=/g)).toHaveLength(4);
    expect(dialog).not.toContain("Share image");
    expect(dialog).toContain('id="shareInstructions"');
    expect(dialog).toContain('id="shareCopyImage"');
    expect(dialog).toContain("Copy image");
    expect(dialog).toContain('id="shareOpenComposer"');
    expect(dialog).toContain("Paste image into the post");
    expect(dialog).not.toContain("Share to</span>");
    expect(dialog).not.toContain("LinkedIn");
    expect(dialog).not.toContain("PNG ready from the latest data shown on this page.");
    expect(dialog).not.toContain("The PNG will be copied first.");
  });
});
