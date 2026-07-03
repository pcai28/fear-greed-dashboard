import { asNumber, fearGreedStatus, titleStatus, toIsoDate } from "../domain/market-status.js";
import { fetchJson as defaultFetchJson } from "./fetch-json.js";

function normalizePoint(raw) {
  if (!raw || typeof raw !== "object") return null;
  const value = asNumber(raw.y ?? raw.value ?? raw.score ?? raw.index);
  const date = toIsoDate(raw.x ?? raw.timestamp ?? raw.date);
  return value == null || !date ? null : { date, value };
}

function collectPoints(json) {
  const candidates = [
    json.fear_and_greed_historical?.data,
    json.fear_and_greed_historical,
    json.historical?.data,
    json.historical,
    json.data
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const points = candidate.map(normalizePoint).filter(Boolean);
    if (points.length) return points;
  }
  return [];
}

export function createCnnFearGreedProvider({ fetchJson = defaultFetchJson } = {}) {
  return async function fetchCnnFearGreed(rangeConfig) {
    const end = Date.now();
    const start = end - rangeConfig.days * 24 * 60 * 60 * 1000;
    const url = `https://production.dataviz.cnn.io/index/fearandgreed/graphdata/${Math.floor(start)}`;
    const json = await fetchJson(url);
    const historicalPoints = collectPoints(json).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    const points = historicalPoints
      .filter((point) => new Date(point.date).getTime() >= start)
      .slice();

    const currentValue = asNumber(
      json.fear_and_greed?.score ??
        json.fear_and_greed?.value ??
        json.fear_and_greed?.rating ??
        json.current?.score
    );
    const latestPoint = historicalPoints.at(-1);
    const latestValue = currentValue ?? latestPoint?.value ?? null;
    const latestDate = toIsoDate(
      json.fear_and_greed?.timestamp || latestPoint?.date || Date.now()
    );
    const apiStatus = json.fear_and_greed?.rating || json.fear_and_greed?.status;

    const latestDay = latestDate?.slice(0, 10);
    const latestDayIncluded = points.some((point) => point.date.slice(0, 10) === latestDay);
    if (latestValue != null && latestDate && !latestDayIncluded) {
      points.push({ date: latestDate, value: latestValue });
      points.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    return {
      latest: {
        value: latestValue,
        date: latestDate,
        status: titleStatus(apiStatus) || fearGreedStatus(latestValue)
      },
      points
    };
  };
}
