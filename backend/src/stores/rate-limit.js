export function createRateLimitStore({ redis, windowMs, logger = console }) {
  const memory = new Map();
  let redisWarningReported = false;

  function windowFor(now) {
    const start = Math.floor(now / windowMs) * windowMs;
    return { start, resetAt: start + windowMs };
  }

  function incrementMemory(identifier, now) {
    const { start, resetAt } = windowFor(now);
    const key = `${identifier}:${start}`;
    const current = memory.get(key);
    const count = current?.resetAt === resetAt ? current.count + 1 : 1;
    memory.set(key, { count, resetAt });

    for (const [storedKey, entry] of memory) {
      if (entry.resetAt <= now) memory.delete(storedKey);
    }
    return { count, resetAt };
  }

  async function incrementRedis(identifier, now) {
    const { start, resetAt } = windowFor(now);
    const key = `ratelimit:${identifier}:${start}`;
    const count = Number(await redis.command(["INCR", key]));
    if (count === 1) {
      await redis.command(["EXPIRE", key, Math.ceil(windowMs / 1000) + 5]);
    }
    return { count, resetAt };
  }

  return {
    async increment(identifier, now = Date.now()) {
      if (redis.enabled) {
        try {
          return await incrementRedis(identifier, now);
        } catch (error) {
          if (!redisWarningReported) {
            logger.warn(`Redis rate limit failed; using local memory fallback. ${error.message}`);
            redisWarningReported = true;
          }
        }
      }
      return incrementMemory(identifier, now);
    }
  };
}
