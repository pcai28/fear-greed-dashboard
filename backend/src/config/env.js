import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const backendRoot = resolve(fileURLToPath(new URL("../../", import.meta.url)));
const projectRoot = resolve(backendRoot, "..");

dotenv.config({ path: resolve(projectRoot, ".env"), quiet: true });

const isProduction = process.env.NODE_ENV === "production";

function positiveInteger(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function isTurnstileTestKey(value) {
  return /^[123]x0{10,}/i.test(String(value || ""));
}

export const env = Object.freeze({
  isProduction,
  host: process.env.HOST || (isProduction ? "0.0.0.0" : "127.0.0.1"),
  port: Number(process.env.PORT || (isProduction ? 5173 : 5174)),
  frontendDist: resolve(projectRoot, "frontend", "dist"),
  cacheMs: 10 * 60 * 1000,
  rateLimitWindowMs: 60 * 1000,
  rateLimitMax: 60,
  waitlistRateLimitMax: 3,
  rateLimitHashSecret:
    process.env.RATE_LIMIT_HMAC_SECRET || (isProduction ? undefined : "local-development-only"),
  rateLimitHashSecretConfigured: Boolean(process.env.RATE_LIMIT_HMAC_SECRET),
  clientIpHeader: process.env.CLIENT_IP_HEADER || (isProduction ? "x-forwarded-for" : ""),
  trustedProxyHops: positiveInteger(process.env.TRUSTED_PROXY_HOPS),
  redisDisabled: process.env.DISABLE_REDIS_CACHE === "1",
  waitlistDbDisabled: process.env.DISABLE_WAITLIST_DB === "1",
  waitlistEnabled: process.env.WAITLIST_ENABLED === "1",
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
  turnstileSiteKey: process.env.VITE_TURNSTILE_SITE_KEY,
  turnstileExpectedHostname: process.env.TURNSTILE_EXPECTED_HOSTNAME,
  turnstileExpectedAction: process.env.TURNSTILE_EXPECTED_ACTION || "waitlist",
  privacyControllerName: process.env.PRIVACY_CONTROLLER_NAME,
  privacyContactEmail: process.env.PRIVACY_CONTACT_EMAIL,
  businessPostalAddress: process.env.BUSINESS_POSTAL_ADDRESS,
  appRegion: process.env.APP_REGION,
  mongoRegion: process.env.MONGODB_REGION,
  upstashRegion: process.env.UPSTASH_REGION,
  upstashRedisUrl: process.env.UPSTASH_REDIS_REST_URL,
  upstashRedisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  mongoUri: process.env.MONGODB_URI,
  mongoDbName: process.env.MONGODB_DB || "market_emotions"
});

export function assertWaitlistLaunchReady(config = env) {
  if (!config.waitlistEnabled) return;

  const contactEmail = String(config.privacyContactEmail || "").trim();
  const validContactEmail =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) &&
    !/@example\.(com|invalid)$/i.test(contactEmail);
  const controllerName = String(config.privacyControllerName || "").trim();
  const validRegion = (value) => {
    const region = String(value || "").trim();
    return region.length >= 3 && !/provider-region|example|unknown|tbd/i.test(region);
  };
  const required = {
    PRIVACY_CONTROLLER_NAME:
      controllerName.length >= 2 && !/your name|operator|controller|example|tbd/i.test(controllerName),
    PRIVACY_CONTACT_EMAIL: validContactEmail,
    APP_REGION: validRegion(config.appRegion),
    MONGODB_REGION: validRegion(config.mongoRegion),
    UPSTASH_REGION: validRegion(config.upstashRegion),
    RATE_LIMIT_HMAC_SECRET:
      config.rateLimitHashSecretConfigured !== false &&
      String(config.rateLimitHashSecret || "").length >= 32 &&
      config.rateLimitHashSecret !== "local-development-only",
    MONGODB_URI:
      Boolean(config.mongoUri) && !/example\.mongodb|username:password/i.test(config.mongoUri),
    UPSTASH_REDIS_REST_URL:
      Boolean(config.upstashRedisUrl) && !/example\.upstash|redis\.internal/i.test(config.upstashRedisUrl),
    UPSTASH_REDIS_REST_TOKEN:
      Boolean(config.upstashRedisToken) && !/replace-with|test-token/i.test(config.upstashRedisToken),
    TURNSTILE_SECRET_KEY:
      Boolean(config.turnstileSecretKey) &&
      !/replace-with/i.test(config.turnstileSecretKey) &&
      !isTurnstileTestKey(config.turnstileSecretKey),
    VITE_TURNSTILE_SITE_KEY:
      Boolean(config.turnstileSiteKey) &&
      !/replace-with/i.test(config.turnstileSiteKey) &&
      !isTurnstileTestKey(config.turnstileSiteKey),
    TURNSTILE_EXPECTED_HOSTNAME:
      Boolean(config.turnstileExpectedHostname) &&
      !/example|localhost|unknown|tbd/i.test(config.turnstileExpectedHostname),
    TURNSTILE_EXPECTED_ACTION: config.turnstileExpectedAction === "waitlist",
    WAITLIST_DATABASE_ENABLED: !config.waitlistDbDisabled,
    REDIS_ENABLED: !config.redisDisabled
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !String(value || "").trim())
    .map(([name]) => name);

  if (missing.length) {
    throw new Error(`Waitlist launch blocked; configure: ${missing.join(", ")}`);
  }
}
