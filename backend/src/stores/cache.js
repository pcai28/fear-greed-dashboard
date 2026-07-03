function isCacheEntry(value) {
  return Boolean(value?.payload && Number.isFinite(value.time));
}

function parseEntry(value) {
  if (!value) return null;
  try {
    const entry = typeof value === "string" ? JSON.parse(value) : value;
    return isCacheEntry(entry) ? entry : null;
  } catch {
    return null;
  }
}

export function createCacheStore({ redis, cacheMs, logger = console }) {
  const memory = new Map();
  const warnings = new Set();

  function isFresh(entry) {
    return isCacheEntry(entry) && Date.now() - entry.time < cacheMs;
  }

  function warnOnce(message) {
    if (warnings.has(message)) return;
    warnings.add(message);
    logger.warn(message);
  }

  return {
    isFresh,
    async read(key) {
      const memoryEntry = memory.get(key);
      if (isFresh(memoryEntry)) return memoryEntry;

      if (redis.enabled) {
        try {
          const redisEntry = parseEntry(await redis.command(["GET", key]));
          if (redisEntry) {
            memory.set(key, redisEntry);
            return redisEntry;
          }
        } catch (error) {
          warnOnce(`Redis cache read failed; using local memory fallback. ${error.message}`);
        }
      }
      return memoryEntry ?? null;
    },
    async write(key, entry) {
      memory.set(key, entry);
      if (!redis.enabled) return;

      try {
        await redis.command(["SET", key, JSON.stringify(entry)]);
      } catch (error) {
        warnOnce(`Redis cache write failed; using local memory fallback. ${error.message}`);
      }
    }
  };
}
