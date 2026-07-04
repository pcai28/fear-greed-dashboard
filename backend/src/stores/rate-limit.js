import { randomUUID } from "node:crypto";

const slidingWindowScript = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]
local cutoff = now - window

redis.call('ZREMRANGEBYSCORE', key, '-inf', cutoff)
local count = redis.call('ZCARD', key)
local allowed = 0

if count < limit then
  redis.call('ZADD', key, now, member)
  count = count + 1
  allowed = 1
  redis.call('PEXPIRE', key, window + 5000)
end

local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
local resetAt = now + window
if #oldest == 2 then
  resetAt = tonumber(oldest[2]) + window
end

return { allowed, count, resetAt }
`;

export function createRateLimitStore({ redis, windowMs, logger = console }) {
  const memory = new Map();
  let redisWarningReported = false;

  function incrementMemory(identifier, limit, now) {
    const cutoff = now - windowMs;
    const previous = memory.get(identifier) || [];
    const events = previous.filter((timestamp) => timestamp > cutoff);
    const allowed = events.length < limit;
    if (allowed) events.push(now);

    if (events.length) memory.set(identifier, events);
    else memory.delete(identifier);

    for (const [storedIdentifier, timestamps] of memory) {
      if (timestamps.at(-1) <= cutoff) memory.delete(storedIdentifier);
    }

    return {
      allowed,
      count: events.length,
      resetAt: events.length ? events[0] + windowMs : now + windowMs
    };
  }

  async function incrementRedis(identifier, limit, now) {
    const key = `ratelimit:v2:${identifier}`;
    const result = await redis.command([
      "EVAL",
      slidingWindowScript,
      "1",
      key,
      String(now),
      String(windowMs),
      String(limit),
      `${now}:${randomUUID()}`
    ]);
    if (!Array.isArray(result) || result.length !== 3) {
      throw new Error("Redis returned an invalid sliding-window result.");
    }
    return {
      allowed: Number(result[0]) === 1,
      count: Number(result[1]),
      resetAt: Number(result[2])
    };
  }

  return {
    async increment(identifier, { limit, now = Date.now() }) {
      if (!Number.isInteger(limit) || limit < 1) {
        throw new TypeError("Rate-limit maximum must be a positive integer.");
      }
      if (redis.enabled) {
        try {
          return await incrementRedis(identifier, limit, now);
        } catch (error) {
          if (!redisWarningReported) {
            logger.warn(`Redis rate limit failed; using local memory fallback. ${error.message}`);
            redisWarningReported = true;
          }
        }
      }
      return incrementMemory(identifier, limit, now);
    }
  };
}
