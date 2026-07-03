export function fearState(value) {
  if (value == null) return "neutral";
  if (value <= 25) return "extreme-fear";
  if (value <= 45) return "fear";
  if (value <= 55) return "neutral";
  if (value <= 75) return "greed";
  return "extreme-greed";
}

export function vixState(value) {
  if (value == null) return "moderate";
  if (value < 15) return "calm";
  if (value <= 30) return "moderate";
  return "significant";
}
