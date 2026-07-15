# Data Caching and Source Reliability Notes

This note describes the dashboard's current market-data cache, failure behavior, and remaining production reliability trade-offs.

## Current Architecture

The backend uses a two-level cache:

```text
API request
    ↓
L1: Node.js process memory
    ↓ cache miss or expired entry
L2: Upstash Redis
    ↓ cache miss or expired entry
Yahoo VIX + CNN Fear & Greed providers
```

- **L1 memory** provides the fastest reads within one backend process.
- **L2 Upstash Redis** shares successful responses across processes and survives application restarts.
- If Redis is disabled, not configured, or temporarily unavailable, the cache continues with process memory and logs the Redis failure once.

The cached data volume is small. Each range contains timestamped Fear & Greed and VIX values, so all current keys normally require only kilobytes to a few hundred kilobytes.

## Cache Keys and Range Isolation

Each chart range has an independent history key:

```text
market:1D
market:5D
market:1M
market:6M
market:YTD
market:1Y
market:5Y
```

The backend also stores a separate `market:latest` snapshot. This gives every historical range the same canonical latest VIX and Fear & Greed readings, even though their provider ranges and sampling intervals differ.

For example, a request for `1Y` reads `market:1Y` for chart history and `market:latest` for the current gauge values. The service combines the two before returning the response.

## Ten-Minute Freshness Window

Every cache entry contains:

```json
{
  "time": 1784073600000,
  "payload": {}
}
```

An entry is fresh when its `time` is less than 10 minutes old. Fresh entries are returned without calling the external providers.

The 10-minute window is application-level freshness, not currently a Redis expiration. Redis entries are written without `EX` or `PX`, so an expired entry can remain in Redis and be used as a stale fallback after a failed refresh.

The read path is:

1. Return a fresh L1 memory entry when available.
2. Otherwise, read L2 Redis.
3. Copy a valid Redis entry into L1 memory.
4. Return the entry if fresh; otherwise attempt a provider refresh while retaining it as a fallback.

## Refresh Behavior

When an entry needs refreshing, the market-data service fetches Yahoo VIX and CNN Fear & Greed concurrently with `Promise.all()`. It normalizes the two provider responses, aligns their time series, stores the successful payload in memory and Redis, and then returns it.

The latest snapshot has an in-process single-flight guard. Concurrent requests that find `market:latest` expired share the same refresh promise instead of starting duplicate provider calls.

Historical range refreshes do not currently have a per-key single-flight guard. Multiple concurrent cache misses for the same range can therefore trigger duplicate upstream requests.

## What a Service Restart Changes

A restart clears only the L1 process-memory cache. If Upstash Redis is enabled and reachable, the new process can restore entries from Redis and does not necessarily need to call the providers immediately.

If Redis is disabled or unavailable, a restart clears all usable cache state. The next request must fetch fresh provider data before the API can return a market payload.

## Stale-Data Fallback

`isStale` tells the frontend whether the returned data came from a successful current refresh or an older cached fallback.

Fresh response:

```json
{
  "isStale": false,
  "updatedAt": "2026-07-14T...",
  "lastSuccessfulUpdate": "2026-07-14T..."
}
```

Fallback response:

```json
{
  "isStale": true,
  "lastSuccessfulUpdate": "2026-07-14T...",
  "staleReason": "provider_refresh_failed"
}
```

If a refresh fails and an older cache entry exists, the service returns the older payload with `isStale: true`. This keeps the dashboard useful during a provider outage while allowing the frontend to show the last successful update time.

`staleReason` is a stable public code. Raw upstream errors remain server-side because they can contain credentials, internal URLs, or provider implementation details.

If no cached payload exists, the refresh error reaches the centralized Express error handler and the API returns a sanitized error response.

## Failure and Degradation Behavior

### Redis failure

Cache reads and writes fall back to the local memory Map. The application remains available, but cache state becomes process-local and is lost on restart.

### One provider fails

Yahoo and CNN are refreshed with `Promise.all()`, so either provider failing makes the combined refresh fail. The service then returns the previous combined payload when one exists. It does not currently mix one fresh series with one stale series.

### Both providers fail

The behavior is the same: return a stale combined payload if available; otherwise return an API error.

### Multiple backend instances

Redis shares cached responses across instances during normal operation. During a Redis outage, each instance uses its own memory cache, so instances can temporarily return entries with different ages.

## Source Reliability Risks

CNN Fear & Greed graph data and the Yahoo Finance VIX chart endpoint are outside this project's control.

Potential risks include:

- Provider rate limits or `429`, `403`, and temporary `5xx` responses
- Network timeouts
- Response-schema changes
- Delayed or revised market data
- Provider access-policy or terms-of-service changes

The providers use request timeouts, response validation, and normalization adapters, but caching cannot eliminate these upstream risks.

## Current Limitations and Next Steps

For larger public traffic, the next reliability improvements should be:

1. Fetch provider data on a schedule instead of refreshing it in a user request.
2. Add a per-range distributed or in-process single-flight lock to prevent history cache stampedes.
3. Add retry with exponential backoff and jitter for transient provider failures.
4. Consider `Promise.allSettled()` and per-series freshness metadata if partial fresh responses are useful.
5. Add Redis expiration or a maximum stale age so obsolete entries cannot remain available indefinitely.
6. Store normalized snapshots in a durable database if the product needs owned historical data or analysis.
7. Add provider latency, refresh-success, cache-hit, and stale-response metrics.

The preferred higher-scale flow is:

```text
Scheduled worker fetches CNN + Yahoo every 10 minutes
        ↓
Normalize, validate, and align both series
        ↓
Save prepared snapshots to Redis and/or a durable database
        ↓
API servers read prepared data without calling providers
        ↓
Dashboard receives fresh data or an explicitly marked stale snapshot
```

This removes external provider latency from the user request path and reduces the chance that a traffic spike becomes an upstream traffic spike.
