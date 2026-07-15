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
  logger = console,
} = {}) {
  if (!env.rateLimitHashSecret) {
    throw new Error(
      "RATE_LIMIT_HMAC_SECRET is required for a production API runtime.",
    );
  }

  const app = express();

  // Remove this header to hide info for less exposure
  app.disable("x-powered-by");

  // Take the content after ? in URL as req.query
  // parse in a simple way
  app.set("query parser", "simple");

  // Config trust proxy to parse real req.ip
  if (env.trustedProxyHops > 0) app.set("trust proxy", env.trustedProxyHops);

  // Use helmet to add security headers for response
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "same-origin" },
      frameguard: { action: "deny" }, // The page is not allowed to be embedded in an iframe
      hsts: isProduction // when in production, only allows HTTPS
        ? { maxAge: 31_536_000, includeSubDomains: false, preload: false }
        : false,
      referrerPolicy: { policy: "no-referrer" }, // don't send source URL

      // Mitigate XSS (cross-site scripting) risk
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
          formAction: ["'self'"], // form can only submit to itself
          frameAncestors: ["'none'"], // The page is not allowed to be embedded in an iframe
          frameSrc: ["https://challenges.cloudflare.com"], // The page allows Cloudflare iframe
          workerSrc: ["'none'"],
          upgradeInsecureRequests: isProduction ? [] : null,
        },
      },
    }),
  );

  // Explicitly revoke sensitive browser permissions
  app.use((request, response, next) => {
    response.setHeader(
      "permissions-policy",
      "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
    );
    next();
  });

  // Caching is disabled for health check routes
  app.get("/health", (request, response) => {
    response.setHeader("cache-control", "no-store");
    response.status(200).json({ ok: true });
  });

  // Caching is disabled for all /api routes
  // since we return real-time market data
  app.use("/api", (request, response, next) => {
    response.setHeader("cache-control", "no-store");
    next();
  });

  // Rate limit all /api requests
  app.use(
    "/api",
    createRateLimitMiddleware({
      store: dependencies.rateLimitStore,
      limit: rateLimitMax,
      hashSecret: env.rateLimitHashSecret,
      clientIpHeader,
    }),
  );

  // allows us to parse JSON bodies: req.body
  // prevent huge json body
  app.use(express.json({ limit: "4kb" }));

  // mount a router
  app.use(
    "/api/market-emotions",
    createMarketEmotionsRouter({ service: dependencies.marketDataService }),
  );

  // mount a router and rate limit waitlist request
  app.use(
    "/api/waitlist",
    createRateLimitMiddleware({
      store: dependencies.rateLimitStore,
      limit: waitlistRateLimitMax,
      hashSecret: env.rateLimitHashSecret,
      clientIpHeader,
      scope: "waitlist",
    }),
    createWaitlistRouter({
      service: dependencies.waitlistService,
      turnstile: dependencies.turnstileVerifier,
      enabled: waitlistEnabled,
    }),
  );

  // Let express serves frontend & terms as static assets
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
    app.use(
      express.static(frontendDist, { etag: true, index: false, maxAge: "1h" }),
    );
  }

  // handle 404
  app.use(notFound);

  // global error handler
  app.use(createErrorHandler({ isProduction, logger }));
  return { app, dependencies };
}
