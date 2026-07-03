import { describe, expect, it } from "vitest";
import { platformShareInstructions, platformShareUrl, shareCopy, shareFilename } from "../../src/features/share/platforms.js";

describe("share export helpers", () => {
  it("creates stable dated PNG filenames", () => {
    const date = new Date(2026, 6, 1, 12, 0, 0);
    expect(shareFilename("gauges", date)).toBe("market-sentiment-gauges-2026-07-01.png");
    expect(shareFilename("line-chart", date)).toBe("market-sentiment-line-chart-2026-07-01.png");
  });

  it("builds encoded social share URLs", () => {
    const options = { pageUrl: "https://example.com/dashboard", text: "Fear & Greed + VIX" };
    expect(platformShareUrl("x", options)).toContain("twitter.com/intent/tweet");
    expect(platformShareUrl("x", options)).toContain("Fear%20%26%20Greed%20%2B%20VIX");
    expect(platformShareUrl("threads", options)).toContain("threads.net/intent/post");
    expect(platformShareUrl("threads", options)).toContain(encodeURIComponent(`${options.text} ${options.pageUrl}`));
    expect(platformShareUrl("facebook", options)).toContain(encodeURIComponent(options.pageUrl));
    expect(platformShareUrl("reddit", options)).toContain("reddit.com/submit");
    expect(platformShareUrl("reddit", options)).toContain(encodeURIComponent(options.text));
  });

  it("uses copy tailored to the exported chart", () => {
    expect(shareCopy("gauges")).toContain("Today’s");
    expect(shareCopy("line-chart")).toContain("history");
  });

  it("provides concise instructions for each social composer", () => {
    expect(platformShareInstructions("x")).toEqual({
      title: "Share to X",
      composerLabel: "Open X composer"
    });
    expect(platformShareInstructions("threads")).toEqual({
      title: "Share to Threads",
      composerLabel: "Open Threads composer"
    });
    expect(platformShareInstructions("facebook").composerLabel).toBe("Open Facebook composer");
    expect(platformShareInstructions("reddit").title).toBe("Share to Reddit");
  });
});
