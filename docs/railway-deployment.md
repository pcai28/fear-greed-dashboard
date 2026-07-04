# Railway Deployment

The production deployment is one Railway service. Vite builds `frontend/dist`; Express serves those
static files and the API from the same origin.

## Railway service

1. Connect the repository with the repository root as the Railway root directory.
2. Select **US East Metal** (`us-east4-eqdc4a`) to stay near the MongoDB Atlas and Upstash primary
   resources in Northern Virginia.
3. Use the Hobby plan for a persistent service and leave Railway Serverless disabled.
4. `railway.json` supplies the build command, production start command, `/health` deployment check,
   and restart policy. Do not duplicate overrides in the dashboard unless intentionally replacing it.
5. Set a small usage alert or hard limit appropriate for the project budget.

Copy all required values from the local `.env` into Railway Variables. Do not upload `.env`. In
particular, Railway must receive the MongoDB and Upstash credentials, privacy/region fields,
`RATE_LIMIT_HMAC_SECRET`, Turnstile variables, and both waitlist flags when collection is intentionally enabled. Railway
injects `PORT`; do not set it manually.

For Turnstile, create a Cloudflare **Managed** widget restricted to the production custom domain and
set `VITE_TURNSTILE_SITE_KEY` (public build-time key), `TURNSTILE_SECRET_KEY` (backend-only secret),
`TURNSTILE_EXPECTED_HOSTNAME` (hostname only, without scheme or path), and
`TURNSTILE_EXPECTED_ACTION=waitlist`. Railway must provide the `VITE_` value during `npm run build`.
Never prefix the secret with `VITE_`. The server validates Siteverify `success`, hostname, and action
before any MongoDB write and fails closed on timeout or provider failure.

## Client IP source

Set `CLIENT_IP_HEADER=x-forwarded-for`. The application takes the first (leftmost) entry in Railway's
`X-Forwarded-For` chain, validates it as IPv4 or IPv6, immediately HMACs it, and stores only the digest
for short-lived rate limiting. Railway currently recommends this entry because its edge proxy controls
the header and appends proxy entries after the real client IP. `X-Real-IP` is not reliable when
Railway's CDN path is active; see the [Railway employee guidance](https://station.railway.com/questions/which-header-should-i-rely-on-for-real-c-d78a6f96).

Keep `TRUSTED_PROXY_HOPS=0`; the application performs this Railway-specific parsing explicitly rather
than delegating an arbitrary proxy chain to Express. This deployment assumes public requests arrive
through Railway's edge. Never use the derived IP for authentication or authorization.

## Domain and smoke test

Add the custom domain in Railway first, then copy Railway's CNAME and TXT records to the DNS provider.
Keep any external reverse-proxy/CDN feature disabled so public traffic terminates at Railway's edge and
the documented `X-Forwarded-For` guarantee applies. Cloudflare Turnstile is an independent anti-bot
service and does not require the custom domain's traffic to be proxied through Cloudflare.

After deployment, verify:

- `/health` returns `200` with `{ "ok": true }`.
- `/` and `/privacy` load from the same hostname as `/api/market-emotions`.
- production responses include CSP, `X-Content-Type-Options: nosniff`, clickjacking protection, and a
  Referrer Policy; API responses also include `Cache-Control: no-store`.
- production HTML/API responses include one-year HSTS for the current host only. Do not enable
  `includeSubDomains` or preload without separately verifying HTTPS coverage for every subdomain.
- a waitlist submission is rejected while the flags are off; after launch approval, a consented
  submission with a completed Turnstile challenge succeeds without exposing the email or raw IP in logs.
- the Turnstile widget loads from `https://challenges.cloudflare.com`; a missing, expired, reused, or
  hostname/action-mismatched token is rejected and creates no MongoDB record.
