import { fearGreedBand, vixBand } from "../../../shared/src/market-sentiment.js";

const fearGreedLabels = {
  "extreme-fear": "Extreme Fear",
  fear: "Fear",
  neutral: "Neutral",
  greed: "Greed",
  "extreme-greed": "Extreme Greed"
};
const vixLabels = {
  calm: "Calm & Stable",
  moderate: "Moderate Uncertainty & Caution",
  significant: "Significant Fear & Uncertainty"
};

export function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function toIsoDate(input) {
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function fearGreedStatus(value) {
  return fearGreedLabels[fearGreedBand(value)] || "Unavailable";
}

export function vixStatus(value) {
  return vixLabels[vixBand(value)] || "Unavailable";
}

export function titleStatus(value) {
  if (!value) return value;
  return String(value)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
