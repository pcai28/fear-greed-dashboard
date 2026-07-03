export function formatNumber(value, digits = 1) {
  const number = Number(value);
  if (value == null || !Number.isFinite(number)) return "--";
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(number);
}

export function formatDate(value, range = "1Y") {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  const options =
    range === "1D" || range === "5D"
      ? { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
      : { year: "numeric", month: "short", day: "numeric" };
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
