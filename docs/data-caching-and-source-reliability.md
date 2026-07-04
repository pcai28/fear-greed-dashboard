# Data Caching and Source Reliability Notes

This note summarizes how the dashboard currently caches market data and what to consider before production deployment.

## Current Cache Behavior

The dashboard backend currently stores fetched data in Node.js process memory using an in-memory cache.

When running locally with:

```bash
npm run dev
```

the cached data lives in the memory of that local Node.js process on this computer. If the app is deployed to a hosting provider, the same cache would live in the memory of the server, container, or function instance running the app.

The data volume is small. Each range contains only timestamped values for Fear & Greed and VIX, so caching all ranges usually takes only kilobytes to a few hundred kilobytes.

The main limitation is not memory size. The limitation is that process memory is temporary.

## What “Service Restart Clears Cache” Means

The service is the running Node.js backend process.

If any of the following happen, the in-memory cache is cleared:

- The terminal is closed
- The computer or server restarts
- The Node.js process crashes
- The app is redeployed
- A hosting provider restarts the container or serverless function

After restart, the cache starts empty and the app must fetch fresh data again.

## What “Each Range Is Cached for 10 Minutes” Means

A range is one of the chart time windows:

- `1D`
- `5D`
- `1M`
- `6M`
- `YTD`
- `1Y`
- `5Y`

Each range has its own cached response. For example, `1Y` data and `5Y` data are cached separately.

If a user requests `1Y`, the backend fetches CNN Fear & Greed and VIX data, combines them, and stores the result. If another `1Y` request arrives within 10 minutes, the backend returns the cached response instead of calling the external sources again.

## What `isStale` Means

`isStale` tells the frontend whether the returned data is fresh or an older cached fallback.

Fresh response:

```json
{
  "isStale": false,
  "updatedAt": "2026-06-23T..."
}
```

Fallback response:

```json
{
  "isStale": true,
  "lastSuccessfulUpdate": "2026-06-23T...",
  "staleReason": "provider_refresh_failed"
}
```

If live fetching fails but the backend still has a previous successful response, it can return stale data rather than making the whole dashboard fail. `staleReason` is a stable public code; raw provider errors remain server-side so credentials and internal endpoint details cannot leak into API responses.

## Production Storage Options

### In-memory cache

Good for local development, demos, and small personal deployments.

Pros:

- Simple
- Fast
- No database required

Cons:

- Cleared on restart
- Not shared across multiple servers
- No durable history

### File or JSON cache

Good for a small app that needs persistence without a database.

Pros:

- Survives process restart
- Still simple

Cons:

- Concurrency needs care
- Not ideal for multi-instance deployments

### Redis, Upstash, or KV

Good production default for cache-first dashboards.

Pros:

- Fast
- Shared across server instances
- TTL support is built in

Cons:

- Requires an external service

### Database

Good if the dashboard should keep long-term history or support analysis.

Options include Postgres, Supabase, SQLite, or TimescaleDB.

Pros:

- Durable historical records
- Easier trend analysis
- Less dependent on external sources being available at request time

Cons:

- Requires schema design and migrations

## Recommended Production Data Flow

For production, the safer pattern is:

```text
Scheduled job fetches CNN + VIX every 10 minutes
        ↓
Save result to Redis / KV / database
        ↓
Users visit dashboard
        ↓
API returns cached data from our own storage
```

This avoids making every user request trigger external API calls.

## Source Rate Limits and Access Risk

CNN Fear & Greed graph data and Yahoo Finance VIX chart data are not fully controlled by this project.

Potential risks:

- The source may rate-limit requests
- The source may return `429`, `403`, or temporary failures
- The source may change its response shape
- The source may be delayed or revised

For personal use, the current 10-minute cache is usually enough. For public production traffic, the dashboard should avoid fetching external data per user request.

Recommended safeguards:

- Cache responses for at least 10 minutes
- Use stale cache on failure
- Add retry backoff
- Use scheduled fetching
- Consider official or paid market data sources for commercial use
- Respect each provider's terms of service

## Practical Recommendation for This Project

For a simple production version:

1. Keep in-memory cache as a first layer.
2. Add Redis, KV, or a small database for persistence.
3. Fetch data on a schedule rather than on every user request.
4. Return stale data with `isStale: true` when live fetching fails.
5. Show users the last successful update time.
