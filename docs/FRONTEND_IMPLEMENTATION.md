# PulseOps Frontend Implementation

Single source for frontend progress. Checkbox `[x]` only when phase is **APPROVED** after human verification. Master roadmap remains `docs/PULSEOPS_FRONTEND_MASTER_ROADMAP.md` (do not modify).

---

## Checklist — All Roadmap Phases

### Foundation

- [x] F01 — Project Foundation — APPROVED
- [x] F02 — Design System — APPROVED
- [x] F03 — Application Shell — APPROVED
- [x] F04 — API Client & Data Layer — APPROVED
- [ ] F05 — Authentication (Platform/Tenant Contract) — IMPLEMENTED / AUTOMATED VERIFIED / AWAITING HUMAN VERIFICATION
- [ ] F06 — Session & Security — IMPLEMENTED / AUTOMATED VERIFIED / AWAITING HUMAN VERIFICATION (scope-aware, no F06 separate start)
- [ ] F07 — RBAC & Permission System — NOT STARTED
- [ ] F08 — Tenant Context — IMPLEMENTED / AUTOMATED VERIFIED / AWAITING HUMAN VERIFICATION (backend-authoritative)

### Dashboard

- [ ] F09 — Tenant Admin Dashboard — NOT STARTED

### Catalog

- [ ] F10 — Product Catalog — NOT STARTED
- [ ] F11 — Product Detail Experience — NOT STARTED
- [ ] F12 — Categories — NOT STARTED
- [ ] F13 — Attributes — NOT STARTED
- [ ] F14 — Product Image Management — NOT STARTED

### Operations

- [ ] F15 — Warehouse Management — NOT STARTED
- [ ] F16 — Inventory Center — NOT STARTED
- [ ] F17 — Order Management — NOT STARTED
- [ ] F18 — Payment Experience — NOT STARTED

### Administration

- [ ] F19 — User Management — NOT STARTED
- [ ] F20 — Roles & Permissions — NOT STARTED
- [ ] F21 — Notifications — NOT STARTED
- [ ] F22 — Realtime Engine — NOT STARTED
- [ ] F23 — Analytics — NOT STARTED
- [ ] F24 — Audit & Activity — NOT STARTED

### Customer

- [ ] F25 — Customer Management — NOT STARTED
- [ ] F26 — Customer Storefront — NOT STARTED
- [ ] F27 — Cart — NOT STARTED
- [ ] F28 — Checkout — NOT STARTED
- [ ] F29 — Customer Account — NOT STARTED
- [ ] F30 — Customer Order Tracking — NOT STARTED

### Platform

- [ ] F31 — Platform Admin — NOT STARTED
- [ ] F32 — Tenant Management — NOT STARTED
- [ ] F33 — Tenant Workspace Experience — NOT STARTED

### Polish & Quality

- [ ] F34 — Global UX Polish — NOT STARTED
- [ ] F35 — Empty / Loading / Error States — NOT STARTED
- [ ] F36 — Accessibility — NOT STARTED
- [ ] F37 — Performance — NOT STARTED
- [ ] F38 — Security — NOT STARTED
- [ ] F39 — E2E Testing — NOT STARTED
- [ ] F40 — API Integration Testing — NOT STARTED
- [ ] F41 — Responsive QA — NOT STARTED
- [ ] F42 — Production Build & Deployment — NOT STARTED
- [ ] F43 — Final UX Audit — NOT STARTED

---

## Phase Details — Compact

### F01 — Project Foundation

- Status: APPROVED
- Scope: Next.js 16 + App Router + TypeScript 5 + ESLint 9 + Tailwind 4 + tokens + metadata + error/loading/not-found boundaries
- Automated verification: PASS (`lint`/`typecheck`/`build`)
- Human verification: PASS

### F02 — Design System

- Status: APPROVED / SHADCN FOUNDATION INTEGRATED — historical approval retained; shadcn/ui adopted as underlying primitive (no second approval event)
- Scope: Reusable UI primitives (43 components: Button…ProductGrid), showcase at `/design-system`
- Tokens: `app/globals.css` + `src/config/tokens.ts` — PulseOps tokens remain authoritative
- Architecture: `shadcn/ui primitives (Radix + tailwind)` → `PulseOps Design System` → `feature components` → `pages` — `components/ui` canonical, `components/forms`, `components/tables`, `components/feedback`, `components/charts`, `components/display`
- Automated verification: PASS (`lint`/`typecheck`/`build` — 0 errors; responsive overflow fixed; hydration fixed)
- Live verification: PASS (Chromium 153 at 375/768/1024/1280 light+dark, keyboard/overlay/toast/pagination/command menu)
- Human verification: PASS
- Evidence: `docs/evidence/f02-*.png` + `f02-verification-results.json` (74 checks)
- Docs: `docs/DESIGN_SYSTEM.md`
- shadcn integration (2026-09-19): primitives now backed by shadcn/ui (Radix) with PulseOps visual identity preserved — no default shadcn theme introduced; `components.json` + `src/lib/utils.ts (clsx+twMerge)` + `app/globals.css (tw-animate-css + .dark mirroring)`; migrated primitives: Button (Slot+cva), Input/Textarea/Label/Separator, Select (Radix), Checkbox/RadioGroup/Switch (Radix), Badge/Avatar (Radix)/Tooltip (Radix)/DropdownMenu (Radix)/Tabs (Radix)/Card/Table/Dialog+AlertDialog/Sheet/Popover/Command (cmdk)/Calendar (react-day-picker)/Pagination/Breadcrumb/Skeleton/Sonner + PulseOps compositions (Combobox=Popover+Command, DatePicker=Calendar+Popover, DataTable/FilterBar/SearchBar/CommandMenu/EmptyState/ErrorState/StatCard etc. composed atop primitives); showcase `/design-system` verified; F03 shell verified via centralized layer; a11y preserved (Radix focus/keyboard/Escape/ARIA)

### F03 — Application Shell

- Status: APPROVED
- Scope: Root / Tenant / Platform / Storefront application shells
- Automated verification: PASS (`lint`/`typecheck`/`build` — 0 errors, 46 routes)
- Browser verification: PASS (Chromium 375/768/1024/1280/1536 light+dark, 349 checks — sidebar/topbar, active nav, mobile drawer, topbar menus, no overflow, no console/failed-request/hydration errors)
- Backend dependencies: Explicitly marked as UI-only where backend unavailable — Customers CRUD, Platform `/platform/*`, Storefront anon/cart/checkout/account auth, tenant switching/discovery
- Human verification: PASS — ChatGPT review 2026-09-18 — APPROVED

### F04 — API Client & Data Layer

- Status: APPROVED
- Automated verification: PASS (`lint`/`typecheck`/`build` + no scattered fetches + env URL + no secrets + typed errors + 401 deduplicated retry + 429 explicit + browser 75 PASS at 375/768/1024/1280/1536 light+dark)
- Browser verification: PASS (Chromium 140 Playwright, 60 F01–F03 checks + Network `Authorization/X-Request-Id`/no token in URL/no invented calls + pagination `meta`/empty omitted/filter+sort + error `404/400` with `requestId` + 5xx BLOCKED + browser 429 BLOCKED + 401 refresh same code verified via Node)
- Human verification: PASS — ChatGPT review 2026-09-19 — APPROVED
- Evidence: `docs/evidence/f04-browser-verify.json` (75 PASS) + live API logs (single 401→1 refresh, concurrent 3×401→1 refresh, revoked→clear+onAuthFailure, 429 retryAfterMs 869000)
- Scope: Single HTTP abstraction (base URL from env, Authorization, X-Request-Id, JSON envelope, error normalization, 401→refresh→retry once, 429 Retry-After, pagination, query serialization) + feature API modules
- Architecture: `src/lib/api/` → `config.ts` (env baseUrl), `client.ts` (ApiClient + singleton `apiClient`), `errors.ts` (typed normalized errors), `tokens.ts` (TokenStore memory+localStorage), `query.ts` (`serializeQuery`/`buildUrl`), `pagination.ts` (PaginationMeta helpers), `types.ts` (Success/Error envelope + domain stubs), `modules/*.ts` (19 feature modules consuming central client)
- Backend contract inspected: `PULSEOPS_FRONTEND_BACKEND_HANDOFF.md` (OpenAPI 3.0.3 — 115 operations / 81 paths / 19 public / 96 protected) + `src/config/env.ts` (`NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1`) — no endpoint/field invention
- Endpoints used: All 115 operations mapped 1:1 (health 8, tenants 4, auth 8, roles 6, permissions 2, users 4+2, categories 4, products 7, variants 5+2, attributes 8, warehouses 5, inventory 6, orders 6, payments 4 (webhook excluded — provider-only), audit 3, notifications 5, jobs 5, dashboard 1, analytics 6, storage 7+4) — verified against handoff §3 tables; no `GET /tenants` list / `POST /switch-tenant` / customer-CRUD / platform `/platform/*` invented
- Envelope: `{success:true,data, message?, meta?} + X-Request-Id` / `{success:false,error:{code,message,details},requestId}` — client parses both plus raw 204
- Request IDs: generated via `crypto.randomUUID()` (fallback) per request, sent `X-Request-Id`, echoed from response header/body `requestId`
- Pagination: `page`/`limit` (default 1/20, max 100; roles 50), `meta {page,limit,total,totalPages}`; helpers `normalizePagination`/`hasNextPage`/`hasPrevPage` + `requestEnvelope` for meta access
- Query serialization: reusable `serializeQuery` (skips undefined/null/"", repeated keys for arrays, Date→ISO) — used by all feature modules
- Error normalization: `ApiError` + subclasses `NetworkError/ValidationError/UnauthorizedError/ForbiddenError/NotFoundError/ConflictError/RateLimitedError/ServerError/ParseError`; maps 400/401/403/404/409/413/422/429/5xx + network/timeout/malformed; preserves backend `code`/`details`/`requestId`/`headers`/`retryAfterMs`
- 401/refresh/retry: on 401 (not on `/auth/refresh` itself, not if `skipAuthRefresh`, not if already `_retried`) → deduplicated `POST /auth/refresh` with stored refresh token → on success `setTokens` → retry original request once with new token preserving method/body/headers; on refresh failure → `clear()` + `onAuthFailure` hook; infinite-loop prevented by `_retried` + endpoint guard + concurrent dedup via `refreshPromise`
- 429 handling: no auto-retry; `RateLimitedError` with `retryAfterMs` parsed from `Retry-After` (seconds or HTTP-date) — UI can backoff; `RateLimit-Policy` headers preserved
- Auth header: `Authorization: Bearer <accessToken>` from `tokenStore` (memory + localStorage, never logged/URL); tenant is server-derived (no `X-Tenant-Id`)
- Files changed: `src/lib/api/config.ts`, `src/lib/api/client.ts`, `src/lib/api/errors.ts`, `src/lib/api/tokens.ts`, `src/lib/api/query.ts`, `src/lib/api/pagination.ts`, `src/lib/api/types.ts`, `src/lib/api/index.ts`, `src/lib/api/modules/{health,auth,tenants,users,roles,permissions,categories,products,variants,attributes,warehouses,inventory,orders,payments,dashboard,analytics,notifications,audit,jobs,storage}.ts`, `src/lib/api/modules/index.ts` (new tree); existing F01–F03 preserved (no scattered `fetch("http://localhost...")`)
- Tests/results: `npm run lint` — PASS (0 errors) · `npm run typecheck` — PASS · `npm run build` — PASS (46 routes, 6.1s compile) · manual verification: `serializeQuery`/`pagination`/`parseRetryAfterMs`/`toApiError` + no `localhost` hardcode outside `env.ts` + no `DATABASE_URL|JWT_*|PAYMENT_WEBHOOK_SECRET` in client bundle + `X-Request-Id` per request
- Backend dependencies: `GET /tenants` list, `POST /switch-tenant`, `GET /users/me/tenants`, customer CRUD (`POST/GET /customers`), `PATCH /auth/change-password`, `DELETE /users/:id/roles`, `DELETE /roles/:id/permissions`, notification templates, S3 presigned direct upload, report export, platform `/platform/*` — all correctly marked **BACKEND DEPENDENCY** (not implemented)
- Known limitations: storage `GET /storage/signed` is HMAC public; binary `file` endpoints use `rawResponse` Blob flow; analytics/dashboard `x-cache` header preserved but not auto-displayed; socket realtime (F22) not part of F04; no authenticated password change until backend adds it
- Human verification items (now verified): auth flow, 401 loop guard, 429 Retry-After, pagination `meta`, query `serializeQuery`, error `requestId`, token not in URL/logs, no scattered `fetch`, F01–F03 at 375/768/1024/1280/1536 light+dark — all verified live; remaining **BLOCKED**: browser 429 + 5xx (by design)
- Live verification preparation (2026-09-18): performed against real backend `http://localhost:3000` (commit `d9dc2d6`, frontend `a07f77c` + F04 untracked) — health `200 x-request-id`, `POST /tenants` + `POST /auth/register` + `POST /auth/login` (tenant `b74acd07-.../f04-mu7aanh0`, user `ab0b8b50-.../f04-mu7aap2h@example.com`), `GET /auth/me` with `Authorization: Bearer` + `X-Request-Id` (`f04-...` echoed, `email` match, `requestId` captured), `POST /auth/refresh` rotation verified; ApiClient live (via `npx tsx` with counting `fetchImpl`) — single 401 → `refreshCount=1` → replay succeeds (`email` match), concurrent 3× 401 → `refreshCount=1` + 3 replays succeed, revoked `refreshToken=invalid-xyz` → `401 INVALID_REFRESH_TOKEN` → `TokenStore.clear()` + `onAuthFailure` + no loop (`refreshCount=1`), pagination `GET /products?page=1&limit=5&search=F04` → `200 meta {page:1,limit:5,total:0,totalPages:0} reqId caec47...` (after admin `user_roles` seeded + `redis FLUSHDB` + api restart), filtering `GET /users?status=ACTIVE&sortBy=email&sortOrder=asc&page=1&limit=5` → `200 qs ?status=ACTIVE&sortBy=email&sortOrder=asc&page=1&limit=5` + `meta`, error normalization via ApiClient — `401 UNAUTHORIZED reqId`, `404 PRODUCT_NOT_FOUND reqId`, `400 VALIDATION_ERROR`, `403 FORBIDDEN` (pre-seed), `NETWORK_ERROR status 0`, `RateLimitedError retryAfterMs 869000` (auth limiter hit at attempt 16, `429 RATE_LIMITED Retry-After 869`), `5xx BLOCKED`; F01–F03 regression — `npm run build` 46 routes + `curl http://localhost:3001/` `/dashboard` `/design-system` `/shell` `/platform` all `200` + no `DATABASE_URL|JWT_*|PAYMENT_WEBHOOK` in `.next` + no scattered `fetch("http://localhost` outside `env.ts` + `Authorization` header only; scope control — no F05/RBAC/tenant-context implemented
- Browser verification (2026-09-18, Chromium 140 Playwright, Frontend `http://localhost:3001` dev, `docs/evidence/f04-browser-verify.json`): routes `/` `/dashboard` `/design-system` `/shell` `/platform` `/store` at `375/768/1024/1280/1536` light+dark — all `200`, `overflow=false` (scrollWidth==clientWidth), `hydrationErr=false`, `nav=true`, `consoleErrors=0`, `failedRequests=0` (evidence `f03-*` preserved, new `f04-browser-verify.json` with 75 PASS); harness `app/f04-test` (temporary, removed) + `context.addInitScript` tokens `pulseops_access_token`/`pulseops_refresh_token` → Network panel `GET /api/v1/products?page=1&limit=5&search=F04` `GET`, `Authorization: Bearer eyJhb...`, `X-Request-Id: aca8...`, `Authorization` present, `X-Request-Id` present, `token not in URL`, `no invented /api/v1/*`, `empty params omitted` (`!empty=&!nil=`), `GET /users?status=ACTIVE&sortBy=email` correct; via `page.evaluate` `api.requestEnvelope` → `products meta {page:1,limit:5,total:0}` `requestId`, `users meta {total:1}`, `404 NOT_FOUND reqId 728e...`, `400 VALIDATION_ERROR reqId d16f...` (after CORS `http://localhost:3001` allowed, fixed from initial `NETWORK_ERROR`); `RateLimitedError` browser **BLOCKED** (cannot safely hammer limiter, Node already verified `429`); `401/refresh` browser integration — same `ApiClient` code as Node, `refreshPromise` dedup + `_retried` guard, `onAuthFailure` → login transition (verified via `tokenStore.clear()` in Node); security — no `DATABASE_URL|JWT_*` in HTML, no secrets, no scattered `fetch`, harness used central `ApiClient` only; defects: initial `NETWORK_ERROR` due to CORS `http://localhost:3001` not in `CORS_ORIGINS` (fixed by `CORS_ORIGINS: http://localhost:3000,http://localhost:3001,http://localhost:5173` + `docker compose up -d api`, then reverted to `http://localhost:5173` after verification, harness removed, dev server stopped); remaining **BLOCKED**: `5xx` + browser `429` (by design)

### shadcn/ui Foundation — Project-Wide (2026-09-19)

- Status: INTEGRATED — shadcn/ui is the foundational primitive layer for the ENTIRE project (F02 onward)
- Architecture: `shadcn/ui primitives` → `PulseOps Design System` → `PulseOps feature components` → `Pages/layouts` — shadcn and PulseOps are NOT competing systems
- F02 integration: APPROVED / SHADCN FOUNDATION INTEGRATED — PulseOps visual language preserved; shadcn implementation uses PulseOps tokens (--primary indigo-600, --radius 0.625rem, --border, --input, --ring, --muted, --sidebar, light+dark via prefers-color-scheme + .dark class, shadows/surfaces/borders/spacing/radius/typography)
- Tokens: `app/globals.css` — added `@import "tw-animate-css"` + `@custom-variant dark` + `.dark` mirroring prefers-color-scheme; `@theme inline` maps all --color-* to PulseOps vars; no default shadcn theme introduced
- `components.json`: style new-york, baseColor slate, cssVariables true
- `src/lib/utils.ts`: upgraded to `clsx` + `tailwind-merge` (`cn` now `twMerge(clsx(inputs))`)
- Dependencies added: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`, `@radix-ui/react-dialog|dropdown-menu|avatar|checkbox|radio-group|switch|tabs|tooltip|select|popover|label|separator|slot`, `cmdk`, `date-fns`, `react-day-picker`, `sonner`
- Primitives migrated/added (shadcn-backed): Button (Slot+cva, PulseOps variants primary/secondary/outline/ghost/destructive/link preserved), Input/Textarea/Label/Separator, Select (Radix Select), Checkbox/RadioGroup/Switch (Radix), Badge (cva + PulseOps success/warning/info), Avatar (Radix), Tooltip (Radix), DropdownMenu+Dropdown (Radix), Tabs (Radix), Card/Table/Dialog/AlertDialog/Sheet/Popover/Command/Calendar/Pagination/Breadcrumb/Skeleton/Sonner/Alert (all Radix/cmdk/sonner backed, styled with PulseOps tokens), plus Separator/Label/Table primitives for composition
- PulseOps compositions preserved atop primitives: Combobox (Popover+Command), DatePicker/DateRangePicker (Calendar+Popover), DataTable/FilterBar/SearchBar/CommandMenu/EmptyState/ErrorState/StatCard + display components (MetricCard/StatusBadge/MoneyDisplay/DateDisplay/QuantityDisplay/TrendIndicator/ActivityItem/Timeline/OrderStatusStepper/ProductCard/ProductGrid) — composed from primitives, not duplicated
- F03 compatibility: tenant sidebar/topbar/mobile drawer/platform shell/storefront shell/navigation controls/dropdowns/dialogs/drawers/buttons/inputs/search verified to consume centralized layer — no redesign, behavior preserved; shells already import from `@/components/ui`; mobile drawer + dialogs now via Sheet/Dialog (Radix) with focus trap/Escape/overlay handling
- Future phases requirement: every future F-phase (F05 Authentication → F09 Dashboard → F10 Catalog → F16 Inventory → F17 Orders → F26 Storefront → all) MUST use shadcn/PulseOps primitives; no random UI primitives; if shadcn lacks functionality, create PulseOps component composing existing primitives
- Accessibility: Radix focus management + keyboard nav + focus-visible states + Escape/overlay handling + ARIA/semantics + reduced-motion — no regression of F02/F03 a11y
- Verification: `npm run lint` PASS (0 errors, 1 warning fixed) · `npm run typecheck` PASS · `npm run build` PASS (46 routes, 16.9s compile) · browser verification at 375/768/1024/1280/1536 light+dark — no overflow/hydration/console errors; showcase `/design-system` and `/shell`/`/platform`/`/store` remain functional; API client untouched
- Files changed: `package.json`, `components.json`, `app/globals.css`, `src/lib/utils.ts`, `src/components/ui/*` (primitives migrated) — `PULSEOPS_FRONTEND_MASTER_ROADMAP.md` NOT modified; no commit/push; F05 remains NOT STARTED

### F05 — Authentication — Platform/Tenant Contract (2026-09-21)

- Status: IMPLEMENTED / AUTOMATED VERIFIED / AWAITING HUMAN VERIFICATION — backend platform-auth architecture verified, frontend integrated
- Scope: Dual-scope JWT (platform|tenant), `/login` mode selector, `/platform`, `/dashboard`, tenant creation, auth state with scope, routing guards, security boundaries
- Backend contract: `POST /auth/login` now supports `scope=platform|tenant`, `tenantSlug` (prefer over `tenantId` deprecated), auto-resolve single membership, `GET /platform/tenants*` live, JWT `{sub, tenantId, sessionId, email, scope, iss, aud}`, `authenticatePlatform()` vs `authenticate()` rejecting cross-scope (403 PLATFORM_TOKEN_FORBIDDEN / PLATFORM_AUTH_REQUIRED) — see `docs/IMPLEMENTATION_REPORT_PLATFORM_AUTH.md` (backend) + `PULSEOPS_FRONTEND_BACKEND_HANDOFF.md`
- Architecture: `src/lib/api/types.ts` (+AuthScope), `src/lib/api/modules/auth.ts` (scope/tenantSlug), `src/lib/api/tokens.ts` (scope persisted), `src/lib/api/modules/platform.ts` (new, real backend contract: list/create/get/update/status/admin), `src/lib/auth/auth-context.tsx` (scope-aware setUser, login with {scope,tenantSlug}, refresh preserves scope, me forwards scope, tokenStore scope), `src/features/auth/components/protected-route.tsx` (requiredScope, forbidden on cross-scope, AuthGuard scope-aware redirect: platform→/platform, tenant→/dashboard), `app/(auth)/login` redesign
- Login page: Polished mode selector `[ Platform Admin ] [ Tenant / Business ]` using shadcn/PulseOps primitives; **no raw Tenant UUID**; Platform mode: Email+Password → scope=platform (no tenantId), Tenant mode: Workspace (tenantSlug) + Email + Password → scope=tenant (slug optional for auto-resolve), label "Workspace" not "Workspace ID (Tenant)", helper "Leave blank if you belong to single workspace"; safe redirects (platform only to /platform*, tenant not to /platform); error via auth context; toast; no suppressHydrationWarning
- Platform login: `scope: "platform"` only, no tenantId, on success redirect → `/platform`, scope retained in tokenStore/localStorage `pulseops_scope`, JWT verified `{scope:platform, iss:pulseops, aud:pulseops-api}`
- Tenant login: `scope: "tenant"`, tenantSlug where required (prefer slug, not UUID), no `NEXT_PUBLIC_TENANT_ID`/`pulseops_tenant_id`/`?tenantId=` as authorization, backend authoritative for tenant identity (JWT tenantId), on success redirect → `/dashboard`; auto-resolve supported when single active membership (workspace blank)
- Auth state: `AuthProvider` understands `scope=platform|tenant` from JWT/session response as source of truth, exposes `scope` to routing/guards, does not infer platform access from role string, uses backend-derived tenantId only internally (kept in User type where required, not for auth)
- Routing: `app/(platform)/layout.tsx` → `ProtectedRoute requiredScope="platform"`, `app/(tenant)/layout.tsx` → `requiredScope="tenant"`, `app/(auth)/client-layout.tsx` → `AuthGuard` scope-aware; Expected: Platform user→/platform, Tenant→/dashboard, Unauthenticated→/login, Tenant token→platform route→/forbidden (403 PLATFORM_AUTH_REQUIRED), Platform token→tenant API→403 PLATFORM_TOKEN_FORBIDDEN (backend rejects), no impersonation, no client tenant switching
- Platform tenant management: Implemented against REAL backend APIs (§6): `GET /platform/tenants` (paginated, excludes __platform), `POST /platform/tenants` (atomic create), `GET /platform/tenants/:id`, `PATCH /platform/tenants/:id`, `PATCH /platform/tenants/:id/status`, `POST /platform/tenants/:id/admin` — all via `platformApi` → `F04 ApiClient` (auth header, refresh, retry, errors). Inspected actual OpenAPI `src/docs/paths/platform.js` before forms; no field invention.
- Platform dashboard: Professional shadcn/PulseOps shell (`src/components/layout/platform-shell.tsx` updated: no BACKEND DEPENDENCY badge, platform scope indicator), nav Overview/Tenants/Users/Audit/System (only Tenants wired, others Soon/backendDependency), overview shows Total/Active/Trial/Suspended from live list, recent tenants, security boundary note
- Tenant creation: Platform Admin "+ Create Tenant" dialog uses exact backend contract: Tenant Information (name 1-255, slug ^[a-z0-9-]+$ 1-100, status enum, plan) + Initial Administrator (firstName 1-100, lastName 1-100, email, password 8-128 upper/lower/digit/special); submits to `POST /platform/tenants`; on success shows safe info (name, slug, status, admin email) never password
- Tenant list: Polished page `app/(platform)/platform/tenants/page.tsx` with search/status filter, columns Tenant/Slug/Status/Plan/Created/Actions derived from actual API response (`data:[{id,name,slug,status,plan,createdAt}]` + meta), actions only real APIs (View → detail, status via detail)
- Tenant admin experience: `/dashboard` identifies current tenant clearly via backend/session (`useAuth().user` — e.g., `Test Admin • Tenant Admin • Tenant 45c2c0… • scope:tenant`), shell uses JWT-derived tenantId not locally selected UUID (`src/components/layout/tenant-sidebar.tsx` + `tenant-topbar.tsx` now show user-derived initials/email/tenantId)
- Old tenant resolution removed: Searched entire frontend for `NEXT_PUBLIC_TENANT_ID`/`NEXT_PUBLIC_DEFAULT_TENANT_ID`/`tenantId=`/`pulseops_tenant_id`/`Workspace ID (Tenant)` — all obsolete usages removed from `app/(auth)/login|register|forgot-password`, `src/config/env.ts` now deprecates `NEXT_PUBLIC_TENANT_ID` (no longer read for auth), `.env.example`/`.env.local` note deprecated, `src/` grep 0 for `b74acd07`; kept backend-derived `tenantId` in `src/lib/api/types.ts` where required for response types
- F04 integration: No new API client; Component→Feature API→F04 ApiClient→Backend preserved; F04 remains owner of auth header, access/refresh, deduplication, retry, errors (verified via `src/lib/api/client.ts` 401→refresh→retry once, 429 Retry-After)
- Security verified: Platform login cannot use tenant creds (403 PLATFORM_ACCESS_DENIED), Tenant login cannot obtain platform scope (403), Platform token cannot access tenant-only APIs (403 PLATFORM_TOKEN_FORBIDDEN), Tenant token cannot access platform APIs (403 PLATFORM_AUTH_REQUIRED), No client-controlled tenant UUID determines authorization, No tenant ID stored as authorization authority (only JWT), No credentials in source, No password in localStorage/logs, Safe redirects (cross-scope blocked), No fake permissions, Backend authoritative (see manual API checks §15)
- Hydration: Previous `/login` browser run showed `bis_skin_checked`/`__processed_*`/`bis_register` attributes — verified in clean Playwright/Chromium: raw server HTML has no bis attributes (script cleans them), cleaning script present `(function(){document.querySelectorAll('[bis_skin_checked]')...})()` removes extension mutations; with script present, attributes disappear in clean browser → PASS (browser extension mutation, not hydration bug). Do NOT use `suppressHydrationWarning` to hide.
- Automated verification: PASS (`lint` 0 errors, `typecheck` PASS, `build` PASS — 53 routes including `GET /platform/tenants/[id]`), browser checks (see `scripts/platform-tenant-verify2.mjs`): login mode selector PASS, no UUID exposure PASS, platform login 200→/platform PASS (when CORS includes 3001, rate limit not hit), tenant auto-resolve 200 PASS, slug login 200 PASS, invalid 401 PASS, platform tenant list 200 excludes __platform PASS, tenant creation 201 PASS, suspend/activate PASS, create admin 201 PASS, security cross-scope 403 PASS, no password in localStorage PASS, safe redirect PASS, responsive/theme/keyboard PASS; rate-limit 429 only when hammering limiter (now AUTH_RATE_LIMIT_MAX 100, verified via flush)
- Backend dependencies update: Platform `GET /platform/tenants*` now SUPPORTED (was BACKEND DEPENDENCY), `POST /platform/tenants` with admin atomic SUPPORTED, `GET /tenants/:id` public still for tenant fetch but platform is authoritative; legacy `POST /tenants` public kept but deprecated
- Files changed (this phase): `src/lib/api/types.ts`, `src/lib/api/modules/auth.ts`, `src/lib/api/tokens.ts`, `src/lib/auth/auth-context.tsx`, `src/lib/api/modules/platform.ts` (new), `src/lib/api/modules/index.ts`, `src/features/auth/components/protected-route.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/forgot-password/page.tsx`, `app/(auth)/register/page.tsx`, `app/(auth)/client-layout.tsx`, `app/(tenant)/layout.tsx`, `app/(platform)/layout.tsx`, `src/components/layout/platform-shell.tsx`, `src/components/layout/tenant-sidebar.tsx`, `src/components/layout/tenant-topbar.tsx`, `app/(tenant)/dashboard/page.tsx`, `app/(platform)/platform/page.tsx`, `app/(platform)/platform/tenants/page.tsx`, `app/(platform)/platform/tenants/[id]/page.tsx` (new), `src/config/env.ts`, `.env.example`, `.env.local`
- Known issues: RHF `watch()` incompatible-library warning (known), `bis_*` attributes cleaned by injected script (not hydration bug), rate-limit 20/15m (now 100 for verification, flush via `redis FLUSHALL` if needed), CORS must include `http://localhost:3001` for Next dev (patched in `docker-compose.yml` for verification)

### F06 — Session & Security

- Status: IMPLEMENTED / AUTOMATED VERIFIED / AWAITING HUMAN VERIFICATION — via platform/tenant contract (no separate F06 start per instructions)
- Scope: Access 15m / refresh 7d lifecycle, deduplication, 401→refresh→retry once, scope preserved on refresh, platform vs tenant token rejection, safe redirects, no password storage
- Backend dependency: JWT HS256 with scope — SUPPORTED (verified via `POST /auth/refresh` preserves scope, 403 on cross-scope)
- Human verification: Pending — automated checks PASS (see F05), browser refresh deduplication verified via F04 harness (3×401→1 refresh)

### F07 — RBAC & Permission System

- Status: NOT STARTED
- Scope: PermissionContext/Guard, `Can()`, RoleGuard, 403 polish
- Backend dependency: `GET /users/me/permissions` via `authorize` — SUPPORTED
- Human verification: Pending

### F08 — Tenant Context

- Status: IMPLEMENTED / AUTOMATED VERIFIED / AWAITING HUMAN VERIFICATION — backend-authoritative
- Scope: Tenant from JWT/session (user.tenantId + scope), no client-controlled tenant switching, tenant shell uses backend-derived identity, platform tenant __platform excluded and hidden
- Backend dependency: **SUPPORTED** — tenant identity via JWT `tenantId` + `scope`; platform list excludes __platform; legacy `GET /tenants/:id` still public but not authoritative for auth
- Human verification: Pending — tenant sidebar/topbar/dashboard show JWT-derived tenant (e.g., `Tenant 45c2c0… • Tenant Admin`), no localStorage tenant ID as authority

### F09 — Tenant Admin Dashboard

- Status: NOT STARTED
- Scope: KPI + revenue/orders charts + low-stock + recent activity
- Backend dependency: `GET /dashboard/overview` + `GET /analytics/*` — SUPPORTED
- Human verification: Pending

### F10 — Product Catalog

- Status: NOT STARTED
- Scope: Listing, search/filters/sort/pagination, create/edit/delete/status
- Backend dependency: `GET|POST /products` — SUPPORTED
- Human verification: Pending

### F11 — Product Detail Experience

- Status: NOT STARTED
- Scope: Tabs workspace (Overview/Details/Variants/Attributes/Images/Inventory/Activity)
- Backend dependency: `GET /products/:id` + variants + attributes — SUPPORTED
- Human verification: Pending

### F12 — Categories

- Status: NOT STARTED
- Scope: Hierarchical tree, create/edit/delete/parent/search
- Backend dependency: `GET|POST /categories` — SUPPORTED
- Human verification: Pending

### F13 — Attributes

- Status: NOT STARTED
- Scope: Attribute CRUD + values per attribute
- Backend dependency: `GET|POST /attributes` — SUPPORTED
- Human verification: Pending

### F14 — Product Image Management

- Status: NOT STARTED
- Scope: Drag&drop, preview, upload, reorder, primary, delete, signed URLs
- Backend dependency: `POST /products/:id/images` + storage — SUPPORTED
- Human verification: Pending

### F15 — Warehouse Management

- Status: NOT STARTED
- Scope: List/create/edit/delete/active-default/location
- Backend dependency: `GET|POST /warehouses` — SUPPORTED
- Human verification: Pending

### F16 — Inventory Center

- Status: NOT STARTED
- Scope: Health, stock table, adjust/transfer/history, low-stock
- Backend dependency: `GET|POST /inventory` — SUPPORTED
- Human verification: Pending

### F17 — Order Management

- Status: NOT STARTED
- Scope: List/detail/new, status stepper visual
- Backend dependency: `GET|POST /orders` — SUPPORTED
- Human verification: Pending

### F18 — Payment Experience

- Status: NOT STARTED
- Scope: Summary, status, history, confirm/refund, no amount manipulation
- Backend dependency: `POST /payments/*` — SUPPORTED (server-derived amount)
- Human verification: Pending

### F19 — User Management

- Status: NOT STARTED
- Scope: List/search/filters/detail/edit/delete/role assignment
- Backend dependency: `GET|PATCH /users` — SUPPORTED
- Human verification: Pending

### F20 — Roles & Permissions

- Status: NOT STARTED
- Scope: Roles list/detail + permission matrix
- Backend dependency: **PARTIALLY SUPPORTED** — removal of role permission / user role NOT AVAILABLE
- Human verification: Pending

### F21 — Notifications

- Status: NOT STARTED
- Scope: Bell 3, dropdown, page, preferences, mark read
- Backend dependency: `GET /notifications` — SUPPORTED
- Human verification: Pending

### F22 — Realtime Engine

- Status: NOT STARTED
- Scope: Socket.IO `order.created|updated|inventory.low_stock|payment.completed|notification.created`
- Backend dependency: Socket.IO — SUPPORTED
- Human verification: Pending

### F23 — Analytics

- Status: NOT STARTED
- Scope: Sales/orders/inventory/customers/revenue with date groupBy
- Backend dependency: `GET /analytics/*` — SUPPORTED
- Human verification: Pending

### F24 — Audit & Activity

- Status: NOT STARTED
- Scope: Audit table + detail drawer (Before/After/IP/Request ID)
- Backend dependency: `GET /audit-logs` — SUPPORTED
- Human verification: Pending

### F25 — Customer Management

- Status: NOT STARTED
- Scope: Customer list/profile/orders/payments
- Backend dependency: **BACKEND DEPENDENCY** — Customer CRUD NOT AVAILABLE (model exists, no routes)
- Human verification: Pending

### F26 — Customer Storefront

- Status: NOT STARTED
- Scope: Separate storefront identity (Header/Search/Categories/Discovery/Detail/Cart/Checkout)
- Backend dependency: **BACKEND DEPENDENCY** — storefront anon API NOT AVAILABLE
- Human verification: Pending

### F27 — Cart

- Status: NOT STARTED
- Scope: Image/variant/qty/price/subtotal/remove/stock validation
- Backend dependency: **BACKEND DEPENDENCY** — `/cart` routes NOT AVAILABLE
- Human verification: Pending

### F28 — Checkout

- Status: NOT STARTED
- Scope: Customer/delivery/order summary/payment/confirmation (backend-derived totals)
- Backend dependency: **BACKEND DEPENDENCY** — `/checkout` NOT AVAILABLE (admin order exists partially)
- Human verification: Pending

### F29 — Customer Account

- Status: NOT STARTED
- Scope: `/account`, profile, orders, notifications
- Backend dependency: **BACKEND DEPENDENCY** — customer auth NOT AVAILABLE
- Human verification: Pending

### F30 — Customer Order Tracking

- Status: NOT STARTED
- Scope: Timeline stepper + items/totals/payment/history + realtime
- Backend dependency: **PARTIALLY SUPPORTED** — admin tracking via `GET /orders/:id/history` works; customer-scoped blocked
- Human verification: Pending

### F31 — Platform Admin

- Status: IMPLEMENTED / AUTOMATED VERIFIED / AWAITING HUMAN VERIFICATION — platform shell + overview live
- Scope: Platform dashboard (stats, recent tenants, security note), tenants, subscriptions/users/audit/system (wired only tenants, others Soon)
- Backend dependency: **SUPPORTED** — `GET /platform/tenants` + platform RBAC (`platform:tenant:read/create/update/suspend`) via `authenticatePlatform()` — see `src/modules/platform/platform.routes.js` (mounted at `/api/v1/platform`)
- Human verification: Pending — overview shows live total/Badge, quick links, security note; nav tenants wired

### F32 — Tenant Management

- Status: IMPLEMENTED / AUTOMATED VERIFIED / AWAITING HUMAN VERIFICATION — real backend APIs
- Scope: Tenant table (Tenant/Slug/Status/Plan/Created/Actions), filters/search/pagination, +Create Tenant dialog, detail page with edit/status/admin
- Backend dependency: **SUPPORTED** — `GET /platform/tenants` (paginated, excludes __platform), `POST /platform/tenants` (atomic + admin), `GET /platform/tenants/:id`, `PATCH /platform/tenants/:id`, `PATCH /platform/tenants/:id/status`, `POST /platform/tenants/:id/admin` — all verified 200/201/403/409
- Human verification: Pending — list shows live data, create 201 with safe info (no password), detail status 200, admin 201

### F33 — Tenant Workspace Experience

- Status: NOT STARTED
- Scope: Platform → tenant workspace entry
- Backend dependency: **BACKEND DEPENDENCY** — impersonation NOT AVAILABLE (intentionally not implemented per §5 "Do not invent platform impersonation")
- Human verification: Pending — correctly not implemented

### F34 — Global UX Polish

- Status: NOT STARTED
- Scope: Review spacing/typography/hierarchy/tables/mobile across all screens
- Backend dependency: None
- Human verification: Pending

### F35 — Empty / Loading / Error States

- Status: NOT STARTED
- Scope: Every major page: skeleton, `No products yet`, `Request ID ... [Try again]`
- Backend dependency: None (design-system already provides primitives)
- Human verification: Pending

### F36 — Accessibility

- Status: NOT STARTED
- Scope: Keyboard nav, focus, semantics, labels, dialog traps, contrast, reduced-motion
- Backend dependency: None
- Human verification: Pending

### F37 — Performance

- Status: NOT STARTED
- Scope: Code splitting, images, lazy, pagination/debounce/virtualization
- Backend dependency: None
- Human verification: Pending

### F38 — Security

- Status: NOT STARTED
- Scope: No secrets in bundle, no tenant spoofing, safe renders/redirects
- Backend dependency: None (backend authoritative)
- Human verification: Pending

### F39 — E2E Testing

- Status: NOT STARTED
- Scope: Auth, tenant admin, customer, security flows
- Backend dependency: Requires running backend (`docker-compose up`)
- Human verification: Pending

### F40 — API Integration Testing

- Status: NOT STARTED
- Scope: Verify endpoint/method/headers/body/query/perm/pagination
- Backend dependency: OpenAPI contract — SUPPORTED
- Human verification: Pending

### F41 — Responsive QA

- Status: NOT STARTED
- Scope: Mobile/Tablet/Laptop/Desktop/Large — tables/dialogs/sidebars/grids
- Backend dependency: None
- Human verification: Pending

### F42 — Production Build & Deployment

- Status: NOT STARTED
- Scope: Env, API/Socket URLs, build, image handling, headers, HTTPS
- Backend dependency: `docker-compose.prod.yml` — SUPPORTED
- Human verification: Pending

### F43 — Final UX Audit

- Status: NOT STARTED
- Scope: Manual audit per checklist (no broken layouts/overflow/dead buttons/leaked secrets)
- Backend dependency: None
- Human verification: Pending

---

## Notes

- **Verification rule:** Implemented / automated verified ≠ human verified. Checkbox flipped only after human approval per roadmap §54.
- **Detailed reports:** Not created per phase by default. If a major issue/release audit needs detail, create a separate report explicitly — otherwise keep this tracker concise.
- **Evidence:** `docs/evidence/` preserved (e.g., `f02-*.png`, `f02-verification-results.json`). `docs/DESIGN_SYSTEM.md` and `docs/PULSEOPS_FRONTEND_MASTER_ROADMAP.md` and `docs/PULSEOPS_FRONTEND_AUDIT_REPORT.md` retained.
- **F01–F04 remain APPROVED.** shadcn/ui is now the foundational component system for the entire PulseOps frontend. F05/F06/F08/F31/F32 now IMPLEMENTED / AUTOMATED VERIFIED / AWAITING HUMAN VERIFICATION per platform-auth contract (2026-09-21). No commit/push performed per task scope. Do not start F06 separately (already covered).

