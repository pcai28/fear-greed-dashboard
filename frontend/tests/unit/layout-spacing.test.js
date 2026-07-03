import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const layout = readFileSync(resolve(root, "src/styles/layout.css"), "utf8");
const reference = readFileSync(resolve(root, "src/styles/reference.css"), "utf8");
const responsive = readFileSync(resolve(root, "src/styles/responsive.css"), "utf8");

describe("page spacing rhythm", () => {
  it("does not add a second gap before Index Reference", () => {
    expect(reference).toMatch(/\.reference-section\s*{\s*margin-top: 0;/);
  });

  it("gives the quote generous symmetrical spacing", () => {
    expect(layout).toMatch(/\.quote-strip\s*{[\s\S]*margin: var\(--space-12\) 0;[\s\S]*padding: var\(--space-16\) 0;/);
    expect(responsive).toMatch(/\.quote-strip\s*{[\s\S]*margin: var\(--space-8\) 0;[\s\S]*padding: var\(--space-12\) 0;/);
  });
});
