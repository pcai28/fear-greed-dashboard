import { afterEach, describe, expect, it, vi } from "vitest";
import { createRepeatableAnchor } from "../../src/features/navigation/repeatable-anchor.js";

function setup({ hash = "", reducedMotion = false } = {}) {
  let clickHandler;
  const location = { hash };
  const history = {
    pushState: vi.fn((_state, _title, nextHash) => {
      location.hash = nextHash;
    })
  };
  const link = {
    hash: "#waitlistForm",
    addEventListener: vi.fn((_event, handler) => {
      clickHandler = handler;
    }),
    getAttribute: vi.fn(() => "#waitlistForm")
  };
  const target = { scrollIntoView: vi.fn() };
  const preventDefault = vi.fn();

  vi.stubGlobal("window", {
    history,
    location,
    matchMedia: vi.fn(() => ({ matches: reducedMotion }))
  });

  createRepeatableAnchor({ link, target }).init();

  return {
    click: () => clickHandler({ preventDefault }),
    history,
    preventDefault,
    target
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("repeatable anchor", () => {
  it("sets the hash and scrolls on the first click", () => {
    const parts = setup();

    parts.click();

    expect(parts.preventDefault).toHaveBeenCalledOnce();
    expect(parts.history.pushState).toHaveBeenCalledWith(null, "", "#waitlistForm");
    expect(parts.target.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start"
    });
  });

  it("scrolls again when the URL already has the same hash", () => {
    const parts = setup({ hash: "#waitlistForm" });

    parts.click();

    expect(parts.history.pushState).not.toHaveBeenCalled();
    expect(parts.target.scrollIntoView).toHaveBeenCalledOnce();
  });

  it("uses instant scrolling when reduced motion is requested", () => {
    const parts = setup({ reducedMotion: true });

    parts.click();

    expect(parts.target.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start"
    });
  });
});
