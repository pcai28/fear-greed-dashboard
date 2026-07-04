import { fearGreedBand, vixBand } from "../../../../shared/src/market-sentiment.js";

export function fearState(value) {
  return fearGreedBand(value) || "neutral";
}

export function vixState(value) {
  return vixBand(value) || "moderate";
}
