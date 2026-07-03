import { afterEach, describe, expect, it, vi } from "vitest";
import { createThemeController } from "../../src/features/theme/controller.js";

function setup({ saved = null, systemDark = false } = {}) {
  const storage = new Map(saved ? [["market-emotions-theme", saved]] : []);
  const attributes = new Map();
  let clickHandler;
  let systemHandler;

  const button = {
    addEventListener: vi.fn((event, handler) => {
      if (event === "click") clickHandler = handler;
    }),
    setAttribute: vi.fn((name, value) => attributes.set(name, value))
  };
  const mediaQuery = {
    matches: systemDark,
    addEventListener: vi.fn((event, handler) => {
      if (event === "change") systemHandler = handler;
    })
  };

  vi.stubGlobal("document", { documentElement: { dataset: {} } });
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key) => storage.get(key) ?? null),
    setItem: vi.fn((key, value) => storage.set(key, value))
  });
  vi.stubGlobal("window", { matchMedia: vi.fn(() => mediaQuery) });

  const onChange = vi.fn();
  createThemeController({ button, onChange }).init();

  return {
    attributes,
    click: () => clickHandler(),
    onChange,
    setSystemDark(value) {
      mediaQuery.matches = value;
      systemHandler();
    },
    storage
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("theme controller", () => {
  it("starts in auto mode and follows the system theme", () => {
    const parts = setup({ systemDark: true });

    expect(document.documentElement.dataset).toEqual({
      themeMode: "auto",
      theme: "dark"
    });
    expect(parts.storage.get("market-emotions-theme")).toBe("auto");
    expect(parts.attributes.get("aria-label")).toContain("Theme: auto");
    expect(parts.onChange).toHaveBeenLastCalledWith("dark");
  });

  it("cycles auto, light, dark, and back to auto", () => {
    const parts = setup();

    parts.click();
    expect(document.documentElement.dataset.themeMode).toBe("light");
    expect(parts.attributes.get("title")).toBe("Theme: light");

    parts.click();
    expect(document.documentElement.dataset.themeMode).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");

    parts.click();
    expect(document.documentElement.dataset.themeMode).toBe("auto");
  });

  it("updates a live auto theme when the system preference changes", () => {
    const parts = setup();

    parts.setSystemDark(true);

    expect(document.documentElement.dataset.themeMode).toBe("auto");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(parts.onChange).toHaveBeenLastCalledWith("dark");
  });
});
