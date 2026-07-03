import { clamp } from "../../shared/formatters.js";

export function createGauge({ element, needle, min, max, getState }) {
  return {
    update(value) {
      const numeric = Number(value);
      const ratio = Number.isFinite(numeric)
        ? (clamp(numeric, min, max) - min) / (max - min)
        : 0.5;
      const angle = -90 + ratio * 180;
      element.dataset.state = getState(value);
      element.style.setProperty("--needle-angle", `${angle}deg`);
      needle.style.setProperty("--needle-angle", `${angle}deg`);
    }
  };
}
