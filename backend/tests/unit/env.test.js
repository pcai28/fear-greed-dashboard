import { describe, expect, it } from "vitest";
import { assertWaitlistLaunchReady } from "../../src/config/env.js";

const complete = {
  waitlistEnabled: true,
  privacyControllerName: "Acme Markets LLC",
  privacyContactEmail: "privacy@market-emotions.test",
  appRegion: "aws-us-west-2",
  mongoRegion: "aws-us-west-2",
  upstashRegion: "aws-us-west-2",
  rateLimitHashSecret: "test-secret-that-is-at-least-32-characters",
  rateLimitHashSecretConfigured: true,
  mongoUri: "mongodb://database.internal",
  upstashRedisUrl: "https://premium-egret-123.upstash.io",
  upstashRedisToken: "configured-production-like-token",
  waitlistDbDisabled: false,
  redisDisabled: false
  ,turnstileSecretKey: "production-secret-key",
  turnstileSiteKey: "production-site-key",
  turnstileExpectedHostname: "feargreedmarket.com",
  turnstileExpectedAction: "waitlist"
};

describe("waitlist launch gate", () => {
  it("does nothing while collection is disabled", () => {
    expect(() => assertWaitlistLaunchReady({ waitlistEnabled: false })).not.toThrow();
  });

  it("accepts a complete waitlist configuration without a business postal address", () => {
    expect(() => assertWaitlistLaunchReady(complete)).not.toThrow();
  });

  it("names missing launch requirements without printing secret values", () => {
    expect(() => assertWaitlistLaunchReady({ ...complete, mongoRegion: "" })).toThrow(
      /MONGODB_REGION/
    );
  });

  it("rejects Cloudflare test keys at the production launch gate", () => {
    expect(() =>
      assertWaitlistLaunchReady({
        ...complete,
        turnstileSecretKey: "1x0000000000000000000000000000000AA",
        turnstileSiteKey: "1x00000000000000000000AA"
      })
    ).toThrow(/TURNSTILE_SECRET_KEY.*VITE_TURNSTILE_SITE_KEY/);
    expect(() =>
      assertWaitlistLaunchReady({
        ...complete,
        turnstileSecretKey: "3x0000000000000000000000000000000AA",
        turnstileSiteKey: "2x00000000000000000000AB"
      })
    ).toThrow(/TURNSTILE_SECRET_KEY.*VITE_TURNSTILE_SITE_KEY/);
  });
});
