import { marketRanges, resolveMarketRange } from "../config/market-ranges.js";
import { alignSeries } from "../domain/align-series.js";

const PUBLIC_STALE_REASON = "provider_refresh_failed";

function needsOneDayFearBackfill(range, payload) {
  if (range !== "1D" || !Array.isArray(payload?.points)) return false;
  const hasVix = payload.points.some((point) => point.vix != null);
  const hasFearGreed = payload.points.some((point) => point.fearGreed != null);
  return hasVix && !hasFearGreed && payload.latest?.fearGreed?.value != null;
}

function combineHistoryAndLatest(history, snapshot) {
  if (!snapshot?.latest) return history;
  const staleReasons = [history.staleReason, snapshot.staleReason].filter(Boolean);
  return {
    ...history,
    updatedAt: snapshot.updatedAt,
    lastSuccessfulUpdate: snapshot.lastSuccessfulUpdate,
    isStale: Boolean(history.isStale || snapshot.isStale),
    ...(staleReasons.length ? { staleReason: staleReasons.join("; ") } : {}),
    latest: snapshot.latest
  };
}

export function createMarketDataService({ cache, fetchVix, fetchFearGreed }) {
  let latestRefreshPromise;

  async function getLatestSnapshot() {
    const cacheKey = "market:latest";
    const cached = await cache.read(cacheKey);
    if (cache.isFresh(cached)) return cached.payload;
    if (latestRefreshPromise) return latestRefreshPromise;

    latestRefreshPromise = (async () => {
      try {
        const config = marketRanges["1D"];
        const [vix, fearGreed] = await Promise.all([
          fetchVix(config),
          fetchFearGreed(config)
        ]);
        const now = new Date().toISOString();
        const snapshot = {
          updatedAt: now,
          lastSuccessfulUpdate: now,
          isStale: false,
          latest: { vix: vix.latest, fearGreed: fearGreed.latest }
        };
        await cache.write(cacheKey, { time: Date.now(), payload: snapshot });
        return snapshot;
      } catch (error) {
        if (cached?.payload) {
          // Upstream errors can contain credentials or internal URLs; expose only a stable public code.
          return { ...cached.payload, isStale: true, staleReason: PUBLIC_STALE_REASON };
        }
        throw error;
      } finally {
        latestRefreshPromise = null;
      }
    })();
    return latestRefreshPromise;
  }

  async function getHistory(rangeKey) {
    const cacheKey = `market:${rangeKey}`;
    const cached = await cache.read(cacheKey);
    if (cache.isFresh(cached) && !needsOneDayFearBackfill(rangeKey, cached.payload)) {
      return cached.payload;
    }

    try {
      const config = marketRanges[rangeKey];
      const [vix, fearGreed] = await Promise.all([
        fetchVix(config),
        fetchFearGreed(config)
      ]);
      const points = alignSeries(vix.points, fearGreed.points, rangeKey).filter(
        (point) => point.vix != null || point.fearGreed != null
      );
      const now = new Date().toISOString();
      const payload = {
        range: rangeKey,
        updatedAt: now,
        lastSuccessfulUpdate: now,
        isStale: false,
        sources: {
          vix: "Yahoo Finance chart API for ^VIX",
          fearGreed: "CNN Fear & Greed graph data"
        },
        latest: { vix: vix.latest, fearGreed: fearGreed.latest },
        points
      };

      await cache.write(cacheKey, { time: Date.now(), payload });
      return payload;
    } catch (error) {
      if (cached?.payload) {
        // Keep provider diagnostics out of successful API responses that return stale data.
        return { ...cached.payload, isStale: true, staleReason: PUBLIC_STALE_REASON };
      }
      throw error;
    }
  }

  return {
    async get(range) {
      const rangeKey = resolveMarketRange(range);
      const latestPromise = getLatestSnapshot().catch(() => null);
      const history = await getHistory(rangeKey);
      return combineHistoryAndLatest(history, await latestPromise);
    }
  };
}
