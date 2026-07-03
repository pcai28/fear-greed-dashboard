import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const reference = readFileSync(
  resolve(import.meta.dirname, "../../src/views/reference.html"),
  "utf8"
);

describe("reference table semantics", () => {
  it("provides one umbrella heading and subordinate section headings", () => {
    expect(reference).toContain('<h2 id="referenceTitle">How these indicators relate</h2>');
    expect(reference.match(/<h2/g)).toHaveLength(1);
    expect(reference.match(/<h3/g)).toHaveLength(4);
    expect(reference).toContain("30&nbsp;days. Read them together for context—not as standalone trading signals.");
    expect(reference).toContain("<h3>Common patterns—not rules</h3>");
  });

  it("gives both tables intrinsic captions and scoped column headers", () => {
    expect(reference.match(/<caption class="sr-only">/g)).toHaveLength(2);
    expect(reference.match(/<th scope="col">/g)).toHaveLength(6);
  });

  it("uses explicit row headers for patterns and comparison dimensions", () => {
    expect(reference.match(/<th scope="row">/g)).toHaveLength(8);
    expect(reference).toContain('<table class="pattern-table">');
    expect(reference).toContain('<th scope="row">Source</th>');
    expect(reference).toContain('<th scope="row">Calm / Rising market</th>');
    expect(reference).toContain('<td>&gt;60</td><td>&lt;15</td>');
  });
});
