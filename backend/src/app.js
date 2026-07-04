import { existsSync } from "node:fs";
import { resolve } from "node:path";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { createDefaultDependencies } from "./dependencies.js";
import { createErrorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { createRateLimitMiddleware } from "./middleware/rate-limit.js";
import { createMarketEmotionsRouter } from "./routes/market-emotions.js";
import { createWaitlistRouter } from "./routes/waitlist.js";

export function createApp({
  dependencies = createDefaultDependencies(),
  serveFrontend = false,
  frontendDist = env.frontendDist,
  isProduction = env.isProduction,
  waitlistEnabled = env.waitlistEnabled,
  rateLimitMax = env.rateLimitMax,
  waitlistRateLimitMax = env.waitlistRateLimitMax,
  clientIpHeader = env.clientIpHeader,
  logger = console
} = {}) {
  if (!env.rateLimitHashSecret) {
    throw new Error("RATE_LIMIT_HMAC_SECRET is required for a production API runtime.");
  }
  const app = express();

  app.disable("x-powered-by");
  app.set("query parser", "simple");
  if (env.trustedProxyHops > 0) app.set("trust proxy", env.trustedProxyHops);
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "same-origin" },
      frameguard: { action: "deny" },
      hsts: isProduction
        ? { maxAge: 31_536_000, includeSubDomains: false, preload: false }
        : false,
      referrerPolicy: { policy: "no-referrer" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://challenges.cloudflare.com"],
          scriptSrcAttr: ["'none'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "data:"],
          imgSrc: ["'self'", "data:", "blob:"],
          mediaSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          frameSrc: ["https://challenges.cloudflare.com"],
          workerSrc: ["'none'"],
          upgradeInsecureRequests: isProduction ? [] : null
        }
      }
    })
  );
  app.use((request, response, next) => {
    response.setHeader(
      "permissions-policy",
      "camera=(), geolocation=(), microphone=(), payment=(), usb=()"
    );
    next();
  });
  app.get("/health", (request, response) => {
    response.setHeader("cache-control", "no-store");
    response.status(200).json({ ok: true });
  });
  app.use("/api", (request, response, next) => {
    response.setHeader("cache-control", "no-store");
    next();
  });
  app.use(
    "/api",
    createRateLimitMiddleware({
      store: dependencies.rateLimitStore,
      limit: rateLimitMax,
      hashSecret: env.rateLimitHashSecret,
      clientIpHeader
    })
  );
  app.use(express.json({ limit: "4kb" }));
  app.use(
    "/api/market-emotions",
    createMarketEmotionsRouter({ service: dependencies.marketDataService })
  );
  app.use(
    "/api/waitlist",
    createRateLimitMiddleware({
      store: dependencies.rateLimitStore,
      limit: waitlistRateLimitMax,
      hashSecret: env.rateLimitHashSecret,
      clientIpHeader,
      scope: "waitlist"
    }),
    createWaitlistRouter({
      service: dependencies.waitlistService,
      turnstile: dependencies.turnstileVerifier,
      enabled: waitlistEnabled
    })
  );

  if (serveFrontend && existsSync(frontendDist)) {
    app.get("/", (request, response) => {
      response.setHeader("cache-control", "no-cache");
      response.sendFile(resolve(frontendDist, "index.html"));
    });
    app.get("/privacy", (request, response) => {
      response.setHeader("cache-control", "no-cache");
      response.sendFile(resolve(frontendDist, "privacy.html"));
    });
    app.get("/terms", (request, response) => {
      response.setHeader("cache-control", "no-cache");
      response.sendFile(resolve(frontendDist, "terms.html"));
    });
    app.use(express.static(frontendDist, { etag: true, index: false, maxAge: "1h" }));
  }

  app.use(notFound);
  app.use(createErrorHandler({ isProduction, logger }));
  return { app, dependencies };
}
