const MODES = ["auto", "light", "dark"];

const MODE_COPY = {
  auto: {
    label: "Theme: auto, matching your system. Click to switch to light mode.",
    title: "Theme: auto (matches system)"
  },
  light: {
    label: "Theme: light. Click to switch to dark mode.",
    title: "Theme: light"
  },
  dark: {
    label: "Theme: dark. Click to switch to auto mode.",
    title: "Theme: dark"
  }
};

export function createThemeController({ button, onChange }) {
  const systemTheme = window.matchMedia?.("(prefers-color-scheme: dark)");

  function resolve(mode) {
    if (mode === "auto") return systemTheme?.matches ? "dark" : "light";
    return mode;
  }

  function apply(mode, { persist = true } = {}) {
    const nextMode = MODES.includes(mode) ? mode : "auto";
    const resolvedTheme = resolve(nextMode);
    document.documentElement.dataset.themeMode = nextMode;
    document.documentElement.dataset.theme = resolvedTheme;
    if (persist) localStorage.setItem("market-emotions-theme", nextMode);
    button.setAttribute("aria-label", MODE_COPY[nextMode].label);
    button.setAttribute("title", MODE_COPY[nextMode].title);
    onChange(resolvedTheme);
  }

  button.addEventListener("click", () => {
    const current = document.documentElement.dataset.themeMode || "auto";
    const nextIndex = (MODES.indexOf(current) + 1) % MODES.length;
    apply(MODES[nextIndex]);
  });

  systemTheme?.addEventListener?.("change", () => {
    if (document.documentElement.dataset.themeMode === "auto") {
      apply("auto", { persist: false });
    }
  });

  return {
    init() {
      const saved = localStorage.getItem("market-emotions-theme");
      apply(MODES.includes(saved) ? saved : "auto");
    }
  };
}
