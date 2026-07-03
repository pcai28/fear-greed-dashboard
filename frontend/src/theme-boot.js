const modes = ["auto", "light", "dark"];

try {
  const saved = localStorage.getItem("market-emotions-theme");
  const mode = modes.includes(saved) ? saved : "auto";
  const systemIsDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.dataset.theme =
    mode === "dark" || (mode === "auto" && systemIsDark) ? "dark" : "light";
} catch {
  document.documentElement.dataset.themeMode = "auto";
  document.documentElement.dataset.theme = "light";
}
