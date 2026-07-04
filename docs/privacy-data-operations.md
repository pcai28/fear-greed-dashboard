# Privacy and Data Operations

This runbook is the operational counterpart to the public privacy policy. It is not legal advice.

## Data map

| Flow | Data | Purpose | Storage and retention |
| --- | --- | --- | --- |
| Browser → Express → MongoDB Atlas | Email and server-owned consent text, version, and timestamp | One launch notification | Until notice or cancellation, then automatic deletion within 30 days |
| Browser ↔ Cloudflare Turnstile; Express → Cloudflare Siteverify | Challenge token plus the network/device signals Cloudflare uses to distinguish legitimate traffic from abuse | Prevent automated waitlist submissions | Challenge tokens expire after five minutes and are single-use; Cloudflare retention is governed by its service terms |
| Express → Upstash | HMAC-SHA-256 rate-limit identifier and sliding-window event timestamps | API abuse prevention | Redis sorted set expires about 65 seconds after its newest accepted event |
| Browser local storage | `market-emotions-theme` | Theme preference | Remains in the visitor's browser until they clear it |
| Express → Yahoo/CNN endpoints | Requested public market range only | Dashboard market data | User email and waitlist records are never sent |
| Hosting and business email providers | Standard access logs; privacy-request or launch-email contents | Hosting and communications | Use the shortest available operational retention |

Do not add analytics, advertising, error-reporting, email, payment, or SMS vendors without updating
this map and the public policy first.

## Launch gate

Keep `WAITLIST_ENABLED=0` and `VITE_WAITLIST_ENABLED=0` until every item below is complete:

- Set a monitored business contact in `PRIVACY_CONTACT_EMAIL` and `VITE_PRIVACY_CONTACT_EMAIL`.
- Set the real individual or registered-company controller name in `PRIVACY_CONTROLLER_NAME` and
  `VITE_PRIVACY_CONTROLLER_NAME`. This value is public and must not be only a brand alias.
- Record the hosting, MongoDB Atlas, and Upstash cloud provider plus exact region in `APP_REGION`,
  `MONGODB_REGION`, and `UPSTASH_REGION`. Use provider consoles; never infer region from hostnames.
- Prefer one US-West geography for all three services and document any backup/read-replica regions.
- Record hosting access-log retention and disable request-body logging. Target seven days or less where
  the provider supports it.
- Sign or accept applicable data-processing terms for MongoDB, Upstash, hosting, and business email.
- Rotate MongoDB and Upstash credentials, create a long random `RATE_LIMIT_HMAC_SECRET`, keep all
  secrets in the deployment secret manager, and restrict MongoDB network/database-user access.
- Create a Cloudflare Turnstile Managed widget for the production hostname. Set
  `TURNSTILE_SECRET_KEY`, `VITE_TURNSTILE_SITE_KEY`, `TURNSTILE_EXPECTED_HOSTNAME`, and the fixed
  `TURNSTILE_EXPECTED_ACTION=waitlist`. Test keys are accepted only by automated tests and are
  rejected by the production launch gate.
- Set `TRUSTED_PROXY_HOPS` to the documented proxy hop count. Leave it at `0` for direct hosting;
  never copy an arbitrary value from an example.
- For Railway, keep `TRUSTED_PROXY_HOPS=0` and set `CLIENT_IP_HEADER=x-real-ip`. If the production
  custom domain is later proxied through Cloudflare, use `CLIENT_IP_HEADER=cf-connecting-ip` after
  verifying the proxy is active.
- Review the current Yahoo and CNN endpoint terms. Record the review date and reviewer. If automated
  retrieval is not permitted, replace that provider before launch.
- Run `npm test`, `npm run build`, and a production HTTP-header smoke test.

The backend refuses to start with the waitlist enabled when any required launch-gate environment value
is missing or still uses a Turnstile test key. The frontend also keeps the form disabled unless its
flag, public contact details, and Turnstile site key are set. Siteverify must succeed with the expected
hostname and `waitlist` action before Express writes to MongoDB.

## Privacy requests

1. Accept requests only through the published business email.
2. Reply to the same address and require confirmation from that mailbox. Do not request government ID
   for this email-only record.
3. Search MongoDB only after mailbox confirmation. Do not copy the record to a personal email, local
   spreadsheet, or unmanaged device.
4. For access/correction, disclose or update only the requesting email's waitlist record. For deletion,
   delete that record from `waitlist_signups` and confirm completion.
5. Record only request type, received date, completion date, and outcome in a non-PII operations log.
6. If information reached a service provider outside normal expiry, ask that provider to delete it too.

Review unnotified records, this provider list, and completed privacy requests every quarter. Reassess
CCPA applicability and monetary thresholds every January. The California Privacy Protection Agency's
current published gross-revenue threshold is `$26,625,000`, effective January 1, 2025; verify it from
the [official threshold page](https://cppa.ca.gov/regulations/cpi_adjustment.html) rather than copying
an old checklist.

## Launch notice and retention

Before sending the launch notice, set a valid business postal address for CAN-SPAM mail in
`BUSINESS_POSTAL_ADDRESS`. This value is not required while the waitlist only collects consented
email addresses in MongoDB.

The launch email must have accurate From/Reply-To information, a non-deceptive subject, the valid
business postal address, and a working one-click unsubscribe. Do not add newsletters, promotions, or
unrelated content.

After the notice is successfully sent, schedule deletion:

```sh
npm run waitlist:retention -w backend -- notified
```

If the feature is cancelled, schedule deletion without marking records notified:

```sh
npm run waitlist:retention -w backend -- cancelled
```

Both commands set `deleteAt` to 30 days in the future without printing email addresses. MongoDB's TTL
index performs the deletion asynchronously. Confirm counts only; do not export the affected records.

## Incident minimum

If waitlist information may have been accessed improperly: stop collection, rotate affected credentials,
preserve provider audit evidence without copying user data into email, determine affected records and
jurisdictions, and obtain legal advice about notification duties. Update the public policy only after the
facts and current practice are known.
