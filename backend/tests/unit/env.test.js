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
});
