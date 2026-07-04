import { createHmac } from "node:crypto";
import { isIP } from "node:net";

const trustedClientIpHeader = "x-forwarded-for";

function clientIp(request, configuredHeader) {
  const header = String(configuredHeader || "").toLowerCase();
  if (header === trustedClientIpHeader) {
    const value = request.get(header)?.split(",", 1)[0]?.trim();
    if (value && isIP(value)) return value;
  }
  const fallback = request.ip || request.socket.remoteAddress || "unknown";
  return fallback.startsWith("::ffff:") ? fallback.slice(7) : fallback;
}

export function createRateLimitMiddleware({
  store,
  limit,
  hashSecret,
  clientIpHeader = "",
  scope = "global"
}) {
  return async function rateLimit(request, response, next) {
    try {
      if (!hashSecret) throw new Error("Rate-limit hashing is not configured.");
      const identifier = createHmac("sha256", hashSecret)
        .update(`${scope}\0${clientIp(request, clientIpHeader)}`)
        .digest("hex");
      const result = await store.increment(identifier);
      const remaining = Math.max(0, limit - result.count);
      const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));

      response.setHeader("x-ratelimit-limit", String(limit));
      response.setHeader("x-ratelimit-remaining", String(remaining));
      response.setHeader("x-ratelimit-reset", String(Math.ceil(result.resetAt / 1000)));

      if (result.count <= limit) return next();

      response.setHeader("retry-after", String(retryAfter));
      response.status(429).json({
        error: "Too many requests.",
        detail: `Please wait ${retryAfter} seconds before trying again.`
      });
    } catch (error) {
      next(error);
    }
  };
}
