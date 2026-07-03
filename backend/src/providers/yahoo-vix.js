import { asNumber, toIsoDate, vixStatus } from "../domain/market-status.js";
import { fetchJson as defaultFetchJson } from "./fetch-json.js";

export function createYahooVixProvider({ fetchJson = defaultFetchJson } = {}) {
  return async function fetchYahooVix(rangeConfig) {
    const url = new URL("https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX");
    url.searchParams.set("range", rangeConfig.yahooRange);
    url.searchParams.set("interval", rangeConfig.yahooInterval);
    url.searchParams.set("includePrePost", "false");
    url.searchParams.set("events", "history");

    const json = await fetchJson(url);
    const result = json.chart?.result?.[0];
    if (!result) throw new Error("Yahoo VIX response did not include chart data.");

    const timestamps = result.timestamp || [];
    const close = result.indicators?.quote?.[0]?.close || [];
    const meta = result.meta || {};
    const points = timestamps
      .map((timestamp, index) => ({
        date: toIsoDate(timestamp * 1000),
        value: asNumber(close[index])
      }))
      .filter((point) => point.date && point.value != null && point.value > 0);

    const latestValue = asNumber(meta.regularMarketPrice) ?? points.at(-1)?.value ?? null;
    const marketTime = meta.regularMarketTime || timestamps.at(-1) || Date.now() / 1000;

    return {
      latest: {
        value: latestValue,
        date: toIsoDate(marketTime * 1000),
        status: vixStatus(latestValue)
      },
      points
    };
  };
}
