export function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function toIsoDate(input) {
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function fearGreedStatus(value) {
  if (value == null) return "Unavailable";
  if (value <= 25) return "Extreme Fear";
  if (value <= 45) return "Fear";
  if (value <= 55) return "Neutral";
  if (value <= 75) return "Greed";
  return "Extreme Greed";
}

export function vixStatus(value) {
  if (value == null) return "Unavailable";
  if (value < 15) return "Calm & Stable";
  if (value <= 30) return "Moderate Uncertainty & Caution";
  return "Significant Fear & Uncertainty";
}

export function titleStatus(value) {
  if (!value) return value;
  return String(value)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
