function finiteNumber(value) {
  if (value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function fearGreedBand(value) {
  const number = finiteNumber(value);
  if (number == null) return null;
  if (number <= 25) return "extreme-fear";
  if (number <= 45) return "fear";
  if (number <= 55) return "neutral";
  if (number <= 75) return "greed";
  return "extreme-greed";
}

export function vixBand(value) {
  const number = finiteNumber(value);
  if (number == null) return null;
  if (number < 15) return "calm";
  if (number <= 30) return "moderate";
  return "significant";
}
