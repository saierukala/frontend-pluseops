# Production checklist

Everything that has to be decided or set before PulseOps (this web app + the backend API) goes live.
Backend details: `Backend-PluseOps/docs/DEPLOYMENT.md` and `docker-compose.prod.yml`.

## 1. Domains

| Piece | Example | Notes |
| --- | --- | --- |
| Web app | `https://app.example.in` | Staff app, platform console and `/shop/<store>` |
| API | `https://api.example.in` | Same registrable domain as the app if you use cookie mode (§4) |
| Shop subdomains (optional) | `https://acme.shop.example.in` | Wildcard DNS + TLS for `*.shop.example.in`, pointing at the web app |
| Shop custom domains (optional) | `https://www.acmeretail.in` | Verified per shop in Settings → Domains; TLS on the proxy |

## 2. Web app image (build arguments)

`NEXT_PUBLIC_*` values are compiled into the browser bundle. Set them as `--build-arg` and **rebuild** when they change.

| Build arg | Production value |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | `https://app.example.in` |
| `NEXT_PUBLIC_API_URL` | `https://api.example.in` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.example.in/api/v1` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://api.example.in` |
| `NEXT_PUBLIC_REFRESH_TOKEN_TRANSPORT` | `cookie` (recommended, see §4) or empty |
| `NEXT_PUBLIC_DEFAULT_STORE` | Store slug that `/store` opens when the host is not a shop domain (optional) |

```bash
docker build -t pulseops-web:$(git rev-parse --short HEAD) \
  --build-arg NEXT_PUBLIC_APP_URL=https://app.example.in \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.in \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.in/api/v1 \
  --build-arg NEXT_PUBLIC_SOCKET_URL=https://api.example.in \
  --build-arg NEXT_PUBLIC_REFRESH_TOKEN_TRANSPORT=cookie .
docker run -p 3000:3000 pulseops-web:<tag>   # health: GET /login
```

## 3. API environment (secrets from the secret manager, never committed)

**Required** (the prod overlay refuses to start without them):

- [ ] `DATABASE_URL` — managed Postgres with `sslmode=require&connection_limit=10`
- [ ] `REDIS_URL` — managed Redis (BullMQ jobs, cache, rate limits)
- [ ] `CORS_ORIGINS` — exactly the web app origin(s), e.g. `https://app.example.in`; no `*`
- [ ] `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `STORAGE_SIGNING_SECRET`, `PAYMENT_WEBHOOK_SECRET` — distinct random values, 32+ chars (`openssl rand -base64 48`)
- [ ] `NODE_ENV=production` — also turns off the "development mode" sign-up codes shown in the storefront

**Money and tax**

- [ ] `DEFAULT_GST_RATE_PERCENT` — `18` (default). Each workspace can override it in Settings → Regional, tax & contact; `0` turns GST off
- [ ] Workspace currency defaults to `INR`; nothing to set unless a workspace sells in another currency

**Payments (Razorpay)**

- [ ] `CREDENTIALS_ENCRYPTION_KEY` — 32+ chars; required before any shop can save its Razorpay keys. Keep it stable: rotating it makes saved keys unreadable
- [ ] Each shop: Settings → Razorpay card → key id/secret + webhook secret, then add the webhook URL the card shows
      (`https://api.example.in/api/v1/payments/webhook/razorpay/<tenantId>`) in the Razorpay dashboard with the
      `payment.captured` and `order.paid` events (the ones that mark an order paid)

**Email**

- [ ] `SMTP_URL` and `EMAIL_FROM` — without them emails are only logged (no verification, password reset or shopper sign-up codes reach anyone)
- [ ] `APP_URL=https://app.example.in` — links in emails point here

**Auth hardening**

- [ ] Refresh cookie mode: `REFRESH_COOKIE_SAMESITE=strict` (app and API on the same site) or `none` (different sites; forces `Secure`); `REFRESH_COOKIE_DOMAIN` only if the cookie must span subdomains
- [ ] Optional RS256: `JWT_ALGORITHM=RS256`, `JWT_PRIVATE_KEY` (PEM, `\n`-escaped); when rotating keep old public keys in `JWT_PREVIOUS_PUBLIC_KEYS` until old tokens expire
- [ ] `TRUST_PROXY=true` behind a load balancer (correct client IPs for rate limits and audit logs)
- [ ] Platform administrator: `PLATFORM_ADMIN_EMAIL` + strong `PLATFORM_ADMIN_PASSWORD` for the first seed (the dev default is refused outside development)

**Storage**

- [ ] `STORAGE_PROVIDER=s3` with `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (+ `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE=true` for MinIO/R2)

**Storefront domains**

- [ ] `STOREFRONT_BASE_DOMAIN=shop.example.in` if shops get `<slug>.shop.example.in`

**Jobs**

- [ ] Run at least one `worker` container (`node src/worker.js`); `JOB_SCHEDULERS_ENABLED=true` (default) for nightly cleanup and scheduled reports
- [ ] `REPORT_RETENTION_DAYS` (default 30)

## 4. Sign-in model

- One sign-in page for everyone: the API decides from the account whether it is a workspace user (→ `/dashboard`) or a platform administrator (→ `/platform`). Wrong passwords get the same "Invalid credentials" for both.
- Cookie mode (`NEXT_PUBLIC_REFRESH_TOKEN_TRANSPORT=cookie`) keeps refresh tokens in an httpOnly cookie instead of browser storage. It needs the app and API on the same site, or `REFRESH_COOKIE_SAMESITE=none` over HTTPS.

## 5. Go-live steps

1. [ ] `npx prisma migrate deploy` against the production database (never `migrate dev`/`reset`)
2. [ ] `npm run db:seed` once with `PLATFORM_ADMIN_EMAIL`/`PLATFORM_ADMIN_PASSWORD` set — do **not** run `db:seed:demo` in production
3. [ ] Deploy API + worker, check `GET /health`, `/health/db`, `/health/redis`
4. [ ] Deploy the web image, check `GET /login`
5. [ ] Sign in as the platform admin → create the first workspace → sign in as its admin
6. [ ] Set workspace currency/GST/contact details, connect Razorpay, send a test email
7. [ ] Place a test storefront order and confirm the webhook marks it paid
8. [ ] Backups: automated Postgres snapshots + point-in-time recovery; S3 versioning
9. [ ] Monitoring: API `/metrics`, error logs, uptime checks on `/health` and `/login`

## 6. CI

- Web: `.github/workflows/ci.yml` — typecheck, lint, build, Docker build, Playwright e2e against a migrated + seeded backend (`main` of `saierukala/backend-pluseops`).
- API: its own CI (lint, Jest on a fresh database, migrations, Docker build).
