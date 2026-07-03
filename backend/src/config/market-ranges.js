export const marketRanges = Object.freeze({
  "1D": { yahooRange: "1d", yahooInterval: "5m", days: 2 },
  "5D": { yahooRange: "5d", yahooInterval: "15m", days: 7 },
  "1M": { yahooRange: "1mo", yahooInterval: "1d", days: 35 },
  "6M": { yahooRange: "6mo", yahooInterval: "1d", days: 190 },
  YTD: { yahooRange: "ytd", yahooInterval: "1d", days: 380 },
  "1Y": { yahooRange: "1y", yahooInterval: "1d", days: 370 },
  "5Y": { yahooRange: "5y", yahooInterval: "1wk", days: 1835 }
});

export function resolveMarketRange(value) {
  return marketRanges[value] ? value : "1Y";
}
