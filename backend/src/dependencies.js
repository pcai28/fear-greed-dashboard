import { env } from "./config/env.js";
import { createMongoConnection } from "./integrations/mongodb.js";
import { createUpstashClient } from "./integrations/upstash.js";
import { createCnnFearGreedProvider } from "./providers/cnn-fear-greed.js";
import { createYahooVixProvider } from "./providers/yahoo-vix.js";
import { createMarketDataService } from "./services/market-data.js";
import { createWaitlistService } from "./services/waitlist.js";
import { createCacheStore } from "./stores/cache.js";
import { createRateLimitStore } from "./stores/rate-limit.js";

export function createDefaultDependencies() {
  const redis = createUpstashClient({
    url: env.upstashRedisUrl,
    token: env.upstashRedisToken,
    disabled: env.redisDisabled
  });
  const mongo = createMongoConnection({
    uri: env.mongoUri,
    dbName: env.mongoDbName,
    disabled: env.waitlistDbDisabled
  });
  const cache = createCacheStore({ redis, cacheMs: env.cacheMs });
  const rateLimitStore = createRateLimitStore({
    redis,
    windowMs: env.rateLimitWindowMs
  });

  return {
    mongo,
    rateLimitStore,
    marketDataService: createMarketDataService({
      cache,
      fetchVix: createYahooVixProvider(),
      fetchFearGreed: createCnnFearGreedProvider()
    }),
    waitlistService: createWaitlistService({ mongo })
  };
}
