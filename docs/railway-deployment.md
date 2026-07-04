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

The application validates the selected header as one IPv4 or IPv6 address, immediately HMACs it, and
stores only the digest for short-lived rate limiting.

- Direct Railway traffic or Cloudflare DNS-only: `CLIENT_IP_HEADER=x-real-ip`.
- Cloudflare proxied custom domain (orange cloud): `CLIENT_IP_HEADER=cf-connecting-ip`.
- Keep `TRUSTED_PROXY_HOPS=0`; the application reads only the explicitly selected Railway/Cloudflare
  single-value header instead of parsing an arbitrary `X-Forwarded-For` chain.

Never use these IP headers for authentication or authorization. Before selecting `cf-connecting-ip`,
verify the production custom domain is actually proxied by Cloudflare and remove any unnecessary
Railway-generated public domain to reduce proxy bypass paths.

## Domain and smoke test

Add the custom domain in Railway first, then copy Railway's CNAME and TXT records to Cloudflare. If
Cloudflare proxying is enabled, follow Railway's current SSL instructions and confirm Railway reports
that the Cloudflare proxy was detected.

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
