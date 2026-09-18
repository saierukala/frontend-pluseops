# PULSEOPS FRONTEND AUDIT REPORT — Roadmap vs Actual Backend

**Date:** 2026-09-18
**Auditor:** Implementation/Repository-Analysis Agent (Muse Spark)
**Frontend Roadmap:** `docs/PULSEOPS_FRONTEND_MASTER_ROADMAP.md` (2193 lines, Master Roadmap, F01–F43)
**Backend Handoff:** `PULSEOPS_FRONTEND_BACKEND_HANDOFF.md` (Phase 23 Docker/CI complete)
**Backend Root:** `D:\PulseOps\Backend-PluseOps`
**Frontend Root:** `D:\PulseOps\Frontend-PluseOps`
**Backend Source of Truth:** `prisma/schema.prisma`, `src/docs/openapi.js` + `src/docs/paths/*.js`, `src/app/routes.js`, `src/modules/*/*.routes.js|*.validation.js`, `src/realtime/*`, `src/config/env.js`, `.env.example`, `docker-compose.yml`
**Status:** `NOT STARTED → AUDIT COMPLETE` — no code changes, awaiting human verification before F01

> Rule enforced: No endpoint invented. All tables below cite actual backend files. `IMPLEMENTED ≠ APPROVED` — this report is `AUTOMATED VERIFIED` evidence, not `HUMAN VERIFICATION`.

---

## 1. Backend Capability Summary — What the Backend ACTUALLY Supports

### 1.1 Project & Deployment

- **Pattern:** Modular monolith `Route → Controller → Service → Repository → Prisma` + `Adapter` for integrations. Factory `src/app/app.js: createApp()`, composition `src/app/routes.js: apiRouter`, entry `src/app/server.js` (HTTP+Socket.IO+jobs) and standalone `src/worker.js` (BullMQ only) — `PULSEOPS_FRONTEND_BACKEND_HANDOFF.md:15-17`.
- **Stack:** Node ≥22, Express 5.2.1, Prisma 6.19.3, PostgreSQL 16, Redis 7 (ioredis 6.0.0), BullMQ 5.10.2, Socket.IO 4.8.3, jsonwebtoken 9.0.3 HS256, argon2 0.45.1, zod 4.5.4, helmet 8.3.0 — `package.json`, `prisma/schema.prisma:6`.
- **API base:** `http://localhost:3000` (`src/docs/openapi.js:24`). All functional under `/api/v1`; health/readiness/metrics also at root (`src/app/app.js:73-76`). No `/api/v1/api/v1` duplication.
- **OpenAPI:** 3.0.3, 81 path keys → 115 operations, 26 schemas, 21 tags (`src/docs/openapi.js:14-107`). 19 public (`security:[]`), 96 protected (`bearerAuth`) — verified in `src/docs/paths/*.js`.
- **Docker:** 6 services `postgres:16-alpine`, `redis:7-alpine`, `migrate` (`prisma migrate deploy`), `api:3000` (health `wget /health`), `worker` (no ports), volumes `pgdata`/`redisdata`/`./storage:/app/storage` — `docker-compose.yml`. Prod overlay `docker-compose.prod.yml` with `TRUST_PROXY true`, `FAIL_ON_DEPENDENCY_ERROR true`, managed PG/Redis.
- **Envelope:** Success `{success:true, data, message, meta:{page,limit,total,totalPages}}` + `X-Request-Id`; Error `{success:false, error:{code,message,details}, requestId}`. Pagination default `page 1 limit 20 max 100` (roles `50`). `src/common/middleware/request-context.js`.

### 1.2 Data Model (prisma/schema.prisma:10-952)

- **Tenant isolation:** `tenantId` FK Cascade on every tenant-owned table; composites `@@unique([tenantId, slug|code|sku|email|resource,action])`; indexes `[tenantId,…]`. Context `req.context.tenantId` from JWT only — never client-supplied.
- **Enums:** TenantStatus `ACTIVE|SUSPENDED|TRIAL|CANCELLED`; UserStatus `ACTIVE|INACTIVE|SUSPENDED`; TenantMembershipStatus; ProductStatus `ACTIVE|INACTIVE|DRAFT|ARCHIVED`; VariantStatus `ACTIVE|INACTIVE|DRAFT`; AttributeDataType `TEXT|NUMBER|BOOLEAN|OPTION`; InventoryMovementType 9 values `ADJUSTMENT|TRANSFER|ORDER_RESERVATION|ORDER_RELEASE|ORDER_FULFILLMENT|RETURN|DAMAGED|LOST|COUNT`; OrderStatus 9 values `DRAFT|PENDING|CONFIRMED|PROCESSING|SHIPPED|DELIVERED|CANCELLED|REFUNDED|PARTIALLY_REFUNDED`; PaymentStatus 7; PaymentTransactionType 4; RefundStatus 4; NotificationType/Channel 4 each; AuditAction 6.
- **Core models (38):** Tenant, TenantSettings, TenantDomain, User (+`@@unique([email])` global — see §4 gap), TenantMembership `@@unique([tenantId,userId])`, RefreshToken/PasswordResetToken/EmailVerificationToken (SHA-256 `tokenHash` + `expiresAt`), Role (+PlatformRole), Permission (+PlatformPermission), UserRole/RolePermission (+Platform variants), Category (self-hierarchy `parentId`), Product, ProductCategory `isPrimary`, ProductVariant `@@unique([tenantId,sku])` + `barcode` nullable unique, ProductVariantAttribute, ProductImage `storageKey` tenant-scoped `tenants/{tenantId}/…`, AttributeDefinition `@@unique([tenantId,code])`, AttributeValue, Warehouse `@@unique([tenantId,code])` `isDefault/isActive`, Inventory/WarehouseInventory `@@unique([tenantId,productVariantId,warehouseId])`, InventoryMovement `quantityBefore/Changed/After` invariant `after=before+changed`, Customer `@@unique([tenantId,email])`, Order (+OrderItem snapshots +OrderStatusHistory), Payment/PaymentTransaction/Refund/PaymentWebhookEvent `@@unique([tenantId,eventId])`, Notification (+Preference `@@unique([tenantId,userId,channel])` +Template), AuditLog/ActivityLog (sanitized `[REDACTED]`).
- **Money:** `Decimal(12,2)` string `toFixed(2)` everywhere, never Float. Dates `timestamptz(6)` UTC.
- **Not in schema / no table:** `Cart`, `CartItem`, `StorefrontSession`, `PlatformTenantView`, `CustomerAuth`.

### 1.3 Wired API Surface (src/app/routes.js:24-47)

| Router | Mount | Ops | File |
|---|---|---|---|
| health | `/health` + `/api/v1/health` | 6 | `src/modules/health/health.routes.js` |
| tenants | `/api/v1/tenants` | 4 | `src/modules/tenants/tenants.routes.js:33-38` |
| auth | `/api/v1/auth` | 8 | `src/modules/auth/auth.routes.js:45-57` |
| roles | `/api/v1/roles` | 6 | `src/modules/roles/roles.routes.js:40-47` |
| permissions | `/api/v1/permissions` | 2 | `src/modules/permissions/permissions.routes.js:25-30` |
| users | `/api/v1/users` | 6 | `src/modules/users/users.routes.js:40-51` |
| categories | `/api/v1/categories` | 6 | `src/modules/categories/categories.routes.js:41-48` |
| products | `/api/v1/products` | 7 | `src/modules/products/products.routes.js:41-52` |
| variants | `/api/v1/products/:productId/variants` | 7 | `src/modules/variants/variants.routes.js:40-57` (mergeParams) |
| attributes | `/api/v1/attributes` | 10 | `src/modules/attributes/attributes.routes.js:49-61` |
| productImages | `/*` mounted `/api/v1/products/:…/images` + storage | 8 + 4 storage | `src/modules/product-images/product-images.routes.js:57-124`, `src/modules/storage/storage.routes.js:9-13` |
| warehouses | `/api/v1/warehouses` | 5 | `src/modules/warehouses/warehouses.routes.js:18-24` |
| inventory | `/api/v1/inventory` | 6 | `src/modules/inventory/inventory.routes.js:23-32` |
| orders | `/api/v1/orders` | 6 | `src/modules/orders/orders.routes.js:19-27` |
| payments | `/api/v1/payments` | 5 (1 public webhook) | `src/modules/payments/payments.routes.js:34-43` |
| audit/activity | `/api/v1/audit-logs\|activity-logs` | 3 | `src/modules/audit/audit.routes.js:19-26` |
| notifications | `/api/v1/notifications\|notification-preferences` | 5 | `src/modules/notifications/notifications.routes.js:20-28` |
| jobs | `/api/v1/jobs` | 5 | `src/modules/jobs/jobs.routes.js:27-36` |
| dashboard | `/api/v1/dashboard` | 1 | `src/modules/dashboard/dashboard.routes.js:10` |
| analytics | `/api/v1/analytics` | 6 | `src/modules/analytics/analytics.routes.js:33-40` |
| storage | `/api/v1/storage` | 2 | `src/modules/storage/storage.routes.js:9-13` |
| swagger | `/api-docs`, `/api-docs.json`, `/openapi.json`, `/api/v1/openapi.json` | 4 | `src/app/app.js:69` |

**Not wired:** `/customers`, `/cart`, `/checkout`, `/storefront`, `/platform/*`, `/tenants` list, `/users/me/tenants`, `/switch-tenant`.

### 1.4 Auth / RBAC / Realtime / Jobs

- **Auth:** HS256 `issuer:pulseops audience:pulseops-api` (`src/modules/auth/jwt.util.js:21-50`), access `15m` (`JWT_ACCESS_EXPIRY`), refresh `7d` (`JWT_REFRESH_EXPIRY`), rotation revokes old + reuse detection revokes all, forgot `1h`, verify `24h` (`src/config/env.js:38-43`). 7 public auth ops + `GET /auth/me` (Bearer) validates `TenantMembership ACTIVE` + `Tenant ACTIVE|TRIAL` (`src/modules/auth/auth.middleware.js:28-44`).
- **RBAC:** 38 permissions `resource:action` (`prisma/seed.js`), 3 system roles `admin(83 links all 38) manager(34) member(11)`; `authorize(permission)` checks `membership ACTIVE` → `getUserPermissions` cached `pulseops:v1:user:{tenant}:{user}` TTL 300s → `user_roles→role_permissions→permission` (`src/modules/auth/authorization.middleware.js:8-49`); `authorizePlatform` exists but **never mounted** (`:72-86`).
- **Realtime:** Socket.IO same HTTP server (`src/realtime/socket.server.js:7-15`), `socketAuthMiddleware` (`src/realtime/socket.auth.js:5-92`) accepts `auth.token|Authorization header|query.token`, verifies HS256 + `sub/tenantId/sessionId`, loads user ACTIVE, auto-joins `tenant:{tenantId}` + `user:{userId}` (`socket.server.js:25-28`), strict `join/subscribe` guard, 5 `ALLOWED_EVENTS` (`src/realtime/realtime.service.js:59-67`) `order.created|order.updated|inventory.low_stock|payment.completed|notification.created` sanitized via `sanitizePayload` (27 forbidden keys + pattern match).
- **Jobs/BullMQ:** 6 queues `notification|cleanup|webhook|email|report|analytics` prefix `pulseops:v1:queue` (`src/jobs/*`, `src/worker.js`), `GET /jobs/status` + `POST /jobs/notifications|reports|analytics|cleanup` (tenant-scoped, auth required, 202 queued or 200 degraded) — `src/modules/jobs/jobs.routes.js`.
- **Security:** Helmet (`hsts prod`, `frameguard deny`, `nosniff`), CORS allowlist `CORS_ORIGINS` (prod rejects `*` with credentials), compression, HPP, body `1mb`, `globalLimiter 100/15m`, `authLimiter 20/15m`, `webhookLimiter 100/1m` (`src/app/app.js:26-69`, `src/config/env.js:17-95`), `strict Zod .strict()` rejects unknown `amount/status` on payments, multer `10MB` mime allowlist, signed URL HMAC `900s` (`src/common/storage`).

### 1.5 Frontend Current State

- Boilerplate only: `app/page.tsx:1-69` (Next starter), `app/layout.tsx:15-18` (Geist, title "Create Next App"), `package.json:11-16` (`next 16.3.5 react 19.2.8`, no `socket.io-client|zod|react-query|axios` etc), `next.config.ts:3` empty. No `src/` architecture (`src/components|features|lib|hooks` per roadmap §05) — verified `glob app/**/*` 3 files. Every F-phase `NOT STARTED`.

---

## 2. Frontend Roadmap Validation — Per F-Phase

Legend: `SUPPORTED` = can implement fully on real backend now; `PARTIALLY SUPPORTED` = core works but subset blocked; `BACKEND DEPENDENCY` = requires backend capability that does not exist; `BLOCKED` = cannot be manually verified yet due to env/defect (none pre-implementation); `NEEDS CLARIFICATION` = ambiguous spec vs backend.

| F | Phase (roadmap section) | Verdict | Rationale + Evidence |
|---|---|---|---|
| **F01** | Project Foundation (§06) | **SUPPORTED** | Next 16.3.5 + TS 5 + App Router present; needs eslint/aliases/metadata/favicon/tokens but zero backend dependency. `npm run dev\|lint\|build` per acceptance. |
| **F02** | Design System (§07) | **SUPPORTED** | Pure UI primitives (Button, Input, Card, DataTable, Skeleton, Toast, EmptyState, etc) — no backend. Must not create per-module styling (acceptance). |
| **F03** | Application Shell (§08) | **SUPPORTED** | Tenant/Platform/Storefront layouts + nav groups buildable; tenant identity via `GET /auth/me` `tenantId` + `GET /tenants/:id` public; notifications bell via `GET /notifications?isRead=false` meta total. |
| **F04** | API Client & Data Layer (§09) | **SUPPORTED** | Single abstraction required (fetch → feature API → client → backend). Must implement `Authorization` header, `X-Request-Id` echo, error normalization `error.code`, `401 → refresh → retry once`, `429 Retry-After`, pagination `meta`, query serialization, no scattered `fetch("http://localhost…")`. All 115 ops documented. |
| **F05** | Authentication (§10) | **SUPPORTED** | Pages `POST /auth/register/login/refresh/logout/forgot-password/reset-password/verify-email` + `GET /auth/me` — 7 public + 1 protected (`src/modules/auth/auth.routes.js:48-57`). `authLimiter 20/15m` must handle 429. |
| **F06** | Session & Security (§11) | **SUPPORTED** | Access `15m` + refresh `7d` rotation + reuse-revokes-all + expired recovery `Request→401 TOKEN_EXPIRED→refresh→retry once→login` (`src/modules/auth/jwt.util.js`, `auth.middleware.js:56-60`). Needs dedup queue, no infinite loop, logout cleanup. |
| **F07** | RBAC & Permission System (§12) | **SUPPORTED** | `PermissionContext/PermissionGuard/Can()/RoleGuard/ProtectedRoute` buildable via `authorize` + `getUserPermissions` cache; 403 polished page required. Perm matrix 38 perms 3 system roles (`prisma/seed.js`). |
| **F08** | Tenant Context (§13) | **BACKEND DEPENDENCY** | Roadmap itself marks discovery/switching NOT AVAILABLE — verified: no `GET /tenants` list, no `GET /users/me/tenants`, no `POST /switch-tenant` (`src/app/routes.js`, `tenants.routes.js`). Only `GET /auth/me.tenantId` + `GET /tenants/:id` public + `POST/PATCH/DELETE /tenants/:id` public provisioning. Must NOT invent `GET /tenants` etc. UI uses JWT tenant only. |
| **F09** | Tenant Admin Dashboard (§14) | **SUPPORTED** | `GET /dashboard/overview` `dashboard:read` (`src/modules/dashboard/dashboard.routes.js:10`, `PULSEOPS_FRONTEND_BACKEND_HANDOFF.md:106`) aggregates 6 domains `Promise.allSettled` partial failures, `x-cache HIT|MISS` TTL 60s. KPI + revenue/order charts + low-stock + recent orders/activity all derivable. |
| **F10** | Product Catalog (§15) | **SUPPORTED** | `POST|GET|GET/:id|PATCH|DELETE /products` + `POST|GET /products/:productId/categories` (`products.routes.js:41-52`) with filters `search|status|categoryId|minPrice|maxPrice|sku|barcode|attributeFilters` + `sortBy name|brand|status|basePrice|createdAt|updatedAt` + pagination `x-cache`. |
| **F11** | Product Detail (§16) | **SUPPORTED** | Tabs Overview/Details/Variants/Attributes/Images/Inventory/Activity via `GET /products/:id` + variants `7 ops` (`variants.routes.js`) + `PUT/GET .../variants/:variantId/attributes` + images `POST/GET/PATCH/DELETE` — all wired. |
| **F12** | Categories (§17) | **SUPPORTED** | `POST|GET|GET/tree|GET/:id|PATCH|DELETE /categories` `category:*` (`categories.routes.js:41-48`) hierarchical, `parentId` cycle guard, `HAS_CHILDREN` delete guard, `@@unique([tenantId,slug])`. |
| **F13** | Attributes (§18) | **SUPPORTED** | `POST|GET|PATCH|DELETE /attributes` + `POST|GET/:id/values|PATCH|DELETE/:valueId` `attribute:*` + `PUT /products/:productId/variants/:variantId/attributes` replace (`attributes.routes.js:49-61`, `variants.routes.js:51-52`). `code ^[a-z0-9_-]+$` `dataType TEXT|NUMBER|BOOLEAN|OPTION`. |
| **F14** | Product Image Management (§19) | **SUPPORTED** | `POST/GET/PATCH/DELETE /products/:productId/images` + `POST/GET .../variants/:variantId/images` multer `10MB` JPEG/PNG/WebP/GIF + `GET .../file` stream + `GET .../signed-url` HMAC `900s`/SigV4 + `GET /storage/signed|file` (`product-images.routes.js:57-124`, `storage.routes.js`). `storageKey tenants/{tenantId}/…` traversal-protected. |
| **F15** | Warehouse Management (§20) | **SUPPORTED** | `POST|GET|GET/:id|PATCH|DELETE /warehouses` `warehouse:*` (`warehouses.routes.js:18-24`) `code ^[A-Z0-9_-]+$` `@@unique([tenantId,code])` `isDefault/isActive` soft delete. |
| **F16** | Inventory Center (§21) | **SUPPORTED** | `GET /inventory` `GET /inventory/variants/:variantId` `POST /inventory/adjust|transfer` `GET /inventory/movements|low-stock` `inventory:read/update` (`inventory.routes.js:23-32`). `quantityChanged !=0`, `SAME_WAREHOUSE`/`INSUFFICIENT_STOCK` guards, `threshold default10`, `type` 9 enums. Realtime `inventory.low_stock` (`realtime.service.js:143`). |
| **F17** | Order Management (§22) | **SUPPORTED** | `POST|GET|GET/:id|PATCH/:id/status|POST/:id/cancel|GET/:id/history` `order:create|read|update|cancel` (`orders.routes.js:19-27`). State machine `PENDING→CONFIRMED→PROCESSING→SHIPPED→DELIVERED→REFUNDED`; `CANCELLED` from `PENDING|CONFIRMED|PROCESSING`; server derives `Decimal` totals + snapshots + `ORDER_RESERVATION|RELEASE` movements atomically `SELECT FOR UPDATE` sorted. Realtime `order.created|updated`. |
| **F18** | Payment Experience (§23) | **SUPPORTED** | `POST /payments/create` `payment:create` + `POST /payments/confirm` `payment:confirm` + `GET /payments/:id` `payment:read` + `POST /payments/:id/refund` `payment:refund` + `POST /payments/webhook` public HMAC (`payments.routes.js:34-43`). Server-derived `amount=order.total` (`pay_<uuid>`), `strict()` rejects client amount, duplicate pending guard, idempotent webhook `@@unique([tenantId,eventId])`, `HMAC` timingSafeEqual, `refundable=amount−sum(COMPLETED)`. Must never allow frontend amount manipulation. |
| **F19** | User Management (§24) | **SUPPORTED** | `GET /users?search|status|roleId&sortBy…` + `GET /users/:id` + `PATCH /users/:id` allowlist `firstName/lastName/status` + `DELETE /users/:id` + `GET|POST /users/:id/roles` (`users.routes.js:40-51`) `user:read/update/delete`. `search` `email|firstName|lastName` `contains insensitive`, `SELF_DELETION_FORBIDDEN`, `EMAIL_MODIFICATION_FORBIDDEN` 400. |
| **F20** | Roles & Permissions (§25) | **PARTIALLY SUPPORTED** | List/read/create/update/delete + `POST /roles/:id/permissions` works; **BUT** removal `DELETE /roles/:id/permissions/:permId` and `DELETE /users/:id/roles/:roleId` **NOT AVAILABLE** — roadmap §25 explicitly `Role permission removal NOT AVAILABLE / User role removal NOT AVAILABLE`; handoff confirms. Permission matrix display `Read/Create/Update/Delete` buildable, guard must forbid fake DELETE. System roles `isSystem` immutable `403 SYSTEM_ROLE_IMMUTABLE`. |
| **F21** | Notifications (§26) | **SUPPORTED** | `GET /notifications?isRead|type|channel` + `PATCH /notifications/:id/read` + `POST /notifications/read-all` `notification:read/update` + `GET|PATCH /notification-preferences` (`notifications.routes.js:20-28`) `IN_APP|EMAIL|SMS|PUSH` + realtime `notification.created` user-or-tenant (`realtime.service.js:151`). Bell `🔔3` via `?isRead=false` meta total. |
| **F22** | Realtime Engine (§27) | **SUPPORTED** | `socket.io-client` + `src/realtime/socket.server.js` + `socket.auth.js` + `realtime.service.js` — 5 events `order.created|updated, inventory.low_stock, payment.completed, notification.created` tenant/user rooms, sanitized `[REDACTED]`. No custom `join` outside `tenant:{t}|user:{u}` (`FORBIDDEN`). |
| **F23** | Analytics (§28) | **SUPPORTED** | `GET /analytics/overview|sales|orders|inventory|customers|revenue` `analytics:read` (`analytics.routes.js:33-40`) `?from YYYY-MM-DD&to&groupBy day|week|month` + `category|product|status|warehouseId|page/limit` + `x-cache HIT|MISS` TTL `60|180|300`. `date_trunc AT TIME ZONE UTC`. |
| **F24** | Audit & Activity (§29) | **SUPPORTED** | `GET /audit-logs?audit:read` `GET /activity-logs|/:id:activity:read` (`audit.routes.js:19-26`) `?action|resource|resourceId|userId|from|to&sortBy`, sanitized `[REDACTED]` 27 keys, `Before|After|IP|UserAgent|RequestId` drawer. 5 mutations atomically logged. |
| **F25** | Customer Management (§30) | **BACKEND DEPENDENCY** | Roadmap §30 itself `BACKEND DEPENDENCY` — verified: `Customer` model exists (`prisma/schema.prisma:682` `@@unique([tenantId,email])`) but **no** `customersRouter` (`src/app/routes.js` none; grep `customers` only inside `orders`/`analytics`). No `GET /customers`, `POST /customers`, `PATCH|DELETE`. Only indirect via `POST /orders {customerId}` validates tenant-owned customer `404 CUSTOMER_NOT_FOUND`. Desired `/customers|/customers/[id]` UI must stay un-wired. |
| **F26** | Customer Storefront (§31-33) | **BACKEND DEPENDENCY** | No `GET /store|/store/products|/store/products/:id` public; `GET /products` requires `product:read` Bearer (`products.routes.js:46`). No anonymous product listing, no `CustomerAuth`, no storefront JWT. Grep `storefront|cart|checkout` zero routes. Roadmap §53 `Customer storefront auth/API NOT AVAILABLE`. Visual identity can be designed but data operations BLOCKED. |
| **F27** | Cart (§34) | **BACKEND DEPENDENCY** | No `POST|GET|PATCH|DELETE /cart` — verified `src/app/routes.js` + `src/docs/paths/*.js` none. Local cart state possible but stock validation `GET /inventory/variants/:variantId` requires auth + tenant, not for anonymous shopper. |
| **F28** | Checkout (§35) | **BACKEND DEPENDENCY** | `POST /orders` is **admin** order creation (requires existing `customerId` tenant-owned) + `POST /payments/create|confirm` exists, but no `POST /checkout` + no customer creation + no delivery step + no anonymous flow. Roadmap step 1-5 would need to reuse admin order path with existing customer — **PARTIALLY SUPPORTED** only if customer pre-seeded; otherwise dependency. Treat as `BACKEND DEPENDENCY` per §53. Must display backend-derived totals only. |
| **F29** | Customer Account (§36) | **BACKEND DEPENDENCY** | No `GET /account|/account/profile` — `GET /auth/me` is tenant user, not customer. Needs separate customer identity. |
| **F30** | Customer Order Tracking (§37) | **PARTIALLY SUPPORTED** | Timeline `✓ Order placed→Confirmed→Processing→Shipped→Delivered` buildable for **admin** orders via `GET /orders/:id` + `GET /orders/:id/history` + realtime `order.updated`; customer-scoped view blocked by same auth gap as F26. Count as partially supported (admin tracking works). |
| **F31** | Platform Admin (§38-39) | **BACKEND DEPENDENCY** | Roadmap §38 `BACKEND DEPENDENCY` — verified: `PlatformRole|PlatformPermission|PlatformUserRole|PlatformRolePermission` models exist but `authorizePlatform` never wired (`authorization.middleware.js:72-86` comment `Future /platform routes must use… never tenant authorize`). No `/platform|/platform/tenants|/subscriptions|/users|/audit|/system` routes (`src/app/routes.js` none). |
| **F32** | Tenant Management (§40) | **PARTIALLY SUPPORTED** | `POST /tenants` + `GET|PATCH|DELETE /tenants/:id` public exist (`tenants.routes.js:33-38`) but **no** `GET /tenants` list/filter (`NOT AVAILABLE` per handoff table, verified no list route). Table `Tenant Status Plan Users Created Last Activity` cannot be populated without inventory API; `Suspend|Reactivate|Delete` per id works but listing is dependency. |
| **F33** | Tenant Workspace (§41) | **BACKEND DEPENDENCY** | No `POST /platform/tenants/:id/impersonate` / signed JWT for tenant; roadmap warns `Do not simply put another tenant ID into browser request`. |
| **F34-36** | Global UX Polish / Empty-Loading-Error / Accessibility (§42-44) | **SUPPORTED** | Frontend-only: spacing/typography/hierarchy/skeletons/empty `No products yet [Add Product]`/error `Request ID … [Try again]`/keyboard nav/focus/dialog/a11y. No backend block. |
| **F37-38** | Performance / Security (§45-46) | **SUPPORTED** | `SUPPORTED` — App Router splitting/prefetch, image `next/image` + signed URLs, pagination+debounce+cache `x-cache`, plus security requirements enforceable (see §5). |
| **F39-40** | E2E / API Integration Testing (§47-48) | **SUPPORTED** | Flows `Login|Logout|Refresh|Expired|Forgot|Verify`, tenant admin `Dashboard→Audit`, customer `Browse→Cart→Checkout→Tracking`, security `Unauthorized|Forbidden|Cross-tenant|Expired` all testable once wired. Needs backend running (`docker-compose up`). |
| **F41-43** | Responsive QA / Production Build / Final UX Audit (§49-51) | **SUPPORTED** | `SUPPORTED` — `Mobile|Tablet|Laptop|Desktop|Large` + tables/dialogs/sidebar; `next.config.ts` needs `NEXT_PUBLIC_API_URL|SOCKET_URL` env wiring + `output` + security headers; build `npm run build` + image handling + caching + `HTTPS` facade. Backend prod overlay ready. |

**Totals:** SUPPORTED 22, PARTIALLY SUPPORTED 5 (F20, F30, F32 + F08/F28 nuances), BACKEND DEPENDENCY 11 (F08 tenant switching, F25, F26, F27, F28, F29, F31, F33 + subsets) — roadmap §53 list matches verification.

---

## 3. API Mapping — Per Frontend Feature (Real Endpoints Only)

> Base `http://localhost:3000`. All functional under `/api/v1`. `Authorization: Bearer <accessToken>` for 96 protected ops; `X-Request-Id` optional echo; `Content-Type: application/json` except `multipart/form-data` for images. Envelope success `data+meta` / error `error:{code,message,details}` + `requestId`. Pagination `page 1 limit 20 max 100` (roles `50`).

### 3.1 Authentication & Session (F05/F06) — src/modules/auth/auth.routes.js

| Feature | Method | Path | Auth | Permission | Tenant | Request Body | Query | Response 2xx | Pagination/Sort/Filter | Error | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Register | POST | `/api/v1/auth/register` | public | — | `tenantId? uuid` body optional | `email:email req, password:8-128 regex upper+lower+number+special req, firstName:1-100 req, lastName:1-100 req, tenantId?:uuid opt` (`auth.validation.js:3`) `authLimiter 20/15m` | — | `201 {data:{id,tenantId,email,firstName,lastName,status,emailVerified,createdAt}} message Register…` | — | `400 TENANT_REQUIRED|Zod, 403 TENANT_INACTIVE, 404 TENANT_NOT_FOUND, 409 USER_ALREADY_EXISTS, 429` | Creates `TenantMembership ACTIVE` |
| Login | POST | `/api/v1/auth/login` | public | — | `tenantId?` | `email:email req, password:string min1 req, tenantId?:uuid` | — | `200 {data:{accessToken,refreshToken,sessionId,user:{…}}, message Login successful}` `lastLoginAt` set | — | `400 TENANT_REQUIRED, 401 INVALID_CREDENTIALS, 403 ACCOUNT_INACTIVE|TENANT_INACTIVE` | JWT HS256 `sub=userId tenantId sessionId email` `aud:pulseops-api iss:pulseops` expiry `15m` |
| Refresh | POST | `/api/v1/auth/refresh` | public | — | derived from `refreshToken` SHA-256 lookup | `refreshToken:string req` | — | `200 {accessToken new, refreshToken new, sessionId new, user}` rotation atomic | — | `400 Zod, 401 INVALID_REFRESH_TOKEN|REFRESH_TOKEN_EXPIRED|REVOKED` reuse→revoke all | Dedup queue, retry once |
| Logout | POST | `/api/v1/auth/logout` | public | — | — | `refreshToken?:string opt` no auth | — | `200 {data:{success:true,message:Logout successful}}` always 200 idempotent | — | — | Discard tokens local |
| Forgot | POST | `/api/v1/auth/forgot-password` | public | — | `tenantId?` | `email:email req, tenantId?:uuid` authLimiter | — | `200 {data:{success:true,message:If email exists… devToken?:string devOnly}}` enumeration-safe expiry `1h` | — | `400 Zod|TENANT_REQUIRED, 429` | 32 bytes random SHA-256 hash |
| Reset | POST | `/api/v1/auth/reset-password` | public | — | token hash lookup | `token:string req, password:8-128 regex req` | — | `200 {data:{success:true,message:Password reset}}` single-use revokes all refresh | — | `400 INVALID_RESET_TOKEN|RESET_TOKEN_EXPIRED|RESET_TOKEN_USED|Zod` | Revokes all tokens atomic |
| Verify email | POST | `/api/v1/auth/verify-email` | public | — | token hash | `token:string req` | — | `200 {success Email verified}` `24h` single-use | — | `400 INVALID|EXPIRED|USED` |  |
| Me | GET | `/api/v1/auth/me` | **Bearer** `authenticate()` | — | `req.context.tenantId` JWT | header `Authorization` | — | `200 {data:{id,tenantId,email,firstName,lastName,status,emailVerified,lastLoginAt,createdAt,updatedAt}}` validates membership ACTIVE + tenant ACTIVE|TRIAL | — | `401 UNAUTHORIZED|TOKEN_EXPIRED|INVALID_TOKEN|INVALID_TOKEN_CLAIMS|USER_NOT_FOUND, 403 TENANT_INACTIVE` | Source for tenant display |

**Realtime auth:** same HS256 verify via `handshake.auth.token|header|query.token` (`src/realtime/socket.auth.js:5-23`).

### 3.2 Tenants (F08/F32 subset) — src/modules/tenants/tenants.routes.js:33-38

| Feature | Method | Path | Auth | Body | Response | Errors |
|---|---|---|---|---|---|---|
| Create tenant | POST | `/api/v1/tenants` | **none public** | `name 1-255 req, slug 1-100 ^[a-z0-9-]+$ req unique, status ACTIVE|SUSPENDED|TRIAL|CANCELLED opt default TRIAL, plan max50 opt default free` | `201 {data:{id,name,slug,status,plan,created_at,updated_at,settings:{…},domains:[]}}` | `400 Zod empty, 409 TENANT_SLUG_EXISTS` |
| Get tenant | GET | `/api/v1/tenants/:id` | none | `id uuid` | `200 tenant same shape` | `400 Zod, 404 TENANT_NOT_FOUND` |
| Update tenant | PATCH | `/api/v1/tenants/:id` | none | `at least one field name|slug|status|plan` | `200 updated` | `400 empty, 409 slug, 404` |
| Delete tenant | DELETE | `/api/v1/tenants/:id` | none | `id uuid` | `200 {data:null,message:Tenant deleted}` | `404` |
| List tenants | — | — | **NOT AVAILABLE** | — | — | — | Frontend must NOT invent `GET /tenants` |

### 3.3 Users & Roles (F07/F19/F20) — src/modules/users/users.routes.js:40-51, roles.routes.js:40-47, permissions.routes.js:25-30

| Feature | Method | Path | Auth | Perm | Query/Body | Resp |
|---|---|---|---|---|---|---|
| List users | GET | `/api/v1/users` | Bearer | `user:read` | `page1 limit20 max100 search max255 status ACTIVE|INACTIVE|SUSPENDED roleId uuid sortBy createdAt|updatedAt|email|firstName|lastName|status sortOrder asc|desc default createdAt desc` | `200 {data:[{id,tenantId,email,firstName,lastName,status,emailVerified,lastLoginAt,createdAt,updatedAt,roles:[{id,name,isSystem}]}], meta}` never passwordHash |
| Get user | GET | `/api/v1/users/:id` | Bearer | `user:read` | `id uuid` | `200 single + roles` `404 cross-tenant` |
| Update user | PATCH | `/api/v1/users/:id` | Bearer | `user:update` | `id + {firstName?:1-100,lastName?:1-100,status?:enum} at least one; email/passwordHash/tenantId REJECTED 400` | `200 updated` `400 EMAIL_MODIFICATION_FORBIDDEN` |
| Delete user | DELETE | `/api/v1/users/:id` | Bearer | `user:delete` | `id` hard delete | `200 {data:null}` `400 SELF_DELETION_FORBIDDEN 404` |
| Get user roles | GET | `/api/v1/users/:id/roles` | Bearer | `user:read` | `id target user` | `200 [{id,name,description,isSystem}]` |
| Assign roles | POST | `/api/v1/users/:id/roles` | Bearer | `user:update` | `{roleIds:[uuid,uuid] req}` `skipDuplicates` | `200 assigned` `404 USER_NOT_FOUND` filtered cross-tenant |
| Remove user role | DELETE | — | — | — | **NOT AVAILABLE** | Do not fake |
| List roles | GET | `/api/v1/roles` | Bearer | `role:read` | `page1 limit50 max100` | `200 {data:[{id,tenantId,name,description,isSystem,permissions:[],userCount,createdAt}],meta}` |
| Get role | GET | `/api/v1/roles/:id` | Bearer | `role:read` | `id` | `200 single + permissions + userCount` |
| Create role | POST | `/api/v1/roles` | Bearer | `role:create` | `{name 1-100 ^[a-z0-9_-]+$ req, description max500}` | `201` `409 ROLE_NAME_EXISTS` |
| Update role | PATCH | `/api/v1/roles/:id` | Bearer | `role:update` | `{name?,description?} at least one` | `200` `403 SYSTEM_ROLE_IMMUTABLE` |
| Delete role | DELETE | `/api/v1/roles/:id` | Bearer | `role:delete` | `id` | `200` `403 immut` |
| Assign permissions | POST | `/api/v1/roles/:id/permissions` | Bearer | `role:update` | `{permissionIds:[uuid] req}` replaces | `200` filtered cross-tenant |
| Remove role permission | DELETE | — | — | — | **NOT AVAILABLE** | Do not fake |
| List permissions | GET | `/api/v1/permissions` | Bearer | `permission:read` | — | `200 [{id,tenantId,name,resource,action,description,createdAt}]` `@@unique([tenantId,resource,action])` |
| Get permission | GET | `/api/v1/permissions/:id` | Bearer | `permission:read` | `id` | `200` `404 PERMISSION_NOT_FOUND` |

### 3.4 Catalog — Products (F10/F11) — src/modules/products/products.routes.js:41-52, variants.routes.js, attributes.routes.js

| Feature | Method | Path | Perm | Query/Body | Resp |
|---|---|---|---|---|---|
| Create product | POST | `/api/v1/products` | `product:create` | `name 1-255 req, description max5000, brand max100, status ACTIVE|INACTIVE|DRAFT|ARCHIVED default DRAFT, basePrice decimalString ^\d+(\.\d{1,2})? , categories [uuid], primaryCategoryId uuid` | `201 product` |
| List products | GET | `/api/v1/products` | `product:read` | `page1 limit20 max100 search max255 status enum categoryId uuid minPrice maxPrice sku max100 contains barcode max100 contains attributeFilters sortBy name|brand|status|basePrice|createdAt|updatedAt sortOrder asc|desc desc default` `x-cache HIT|MISS` | `200 {data[],meta}` |
| Get product | GET | `/api/v1/products/:id` | `product:read` | `id` | `200 with categories+variants+images` `404 cross-tenant` |
| Update product | PATCH | `/api/v1/products/:id` | `product:update` | `at least one fields` | `200` |
| Delete product | DELETE | `/api/v1/products/:id` | `product:delete` | `id soft` | `200` |
| Set product categories | POST | `/api/v1/products/:productId/categories` | `product:update` | `{categories:[uuid] min1 req, primaryCategoryId? uuid}` | `200 categories` |
| Get product categories | GET | `/api/v1/products/:productId/categories` | `product:read` | `id` | `200` |
| List variants | GET | `/api/v1/products/:productId/variants` | `product:read` | `page/limit/status/search/attribute` | `200 with attributes/images` |
| Get variant | GET | `/api/v1/products/:productId/variants/:variantId` | `product:read` | `productId+variantId` | `200` `404 PRODUCT_NOT_FOUND|VARIANT_NOT_FOUND` |
| Create variant | POST | `/api/v1/products/:productId/variants` | `product:create` | `sku tenant-unique req, barcode nullable unique, price decimalString req, costPrice?, status ACTIVE|INACTIVE|DRAFT` | `201` `409 SKU_EXISTS|BARCODE_EXISTS` |
| Update variant | PATCH | `/api/v1/products/:productId/variants/:variantId` | `product:update` | `at least one sku|barcode|price|costPrice|status` | `200` `409` |
| Delete variant | DELETE | same | `product:delete` | `ids soft` | `200` |
| Get variant attributes | GET | `/api/v1/products/:productId/variants/:variantId/attributes` | `product:read` | `ids` | `200` |
| Set variant attributes | PUT | same | `product:update` | `{attributes:[{attributeDefinitionId:uuid req, value:string req}]}` **replaces** deletes missing | `200` `400 type mismatch` |
| List categories | GET | `/api/v1/categories` | `category:read` | `page limit search isActive parentId sortBy` | `200 {data:[{id,tenantId,parentId,name,slug,description,sortOrder,isActive,createdAt}],meta}` |
| Tree categories | GET | `/api/v1/categories/tree` | `category:read` | — | hierarchical `children[]` |
| Get category | GET | `/api/v1/categories/:id` | `category:read` | `id` | `200` |
| Create category | POST | `/api/v1/categories` | `category:create` | `name 1-255 req, slug 1-100 ^[a-z0-9-]+$ req, description max1000, parentId? uuid, sortOrder? int, isActive? bool` `409 slug 400 CYCLE_DETECTED` | `201` |
| Update category | PATCH | `/api/v1/categories/:id` | `category:update` | `at least one` | `200` `409` |
| Delete category | DELETE | `/api/v1/categories/:id` | `category:delete` | `id` | `400 HAS_CHILDREN 404` |

### 3.5 Attributes (F13) — src/modules/attributes/attributes.routes.js:49-61

| Feature | Method | Path | Perm | Body | Resp |
|---|---|---|---|---|---|
| Create attribute | POST | `/api/v1/attributes` | `attribute:create` | `name 1-255 req, code 1-100 ^[a-z0-9_-]+$ req unique per tenant, dataType TEXT|NUMBER|BOOLEAN|OPTION req, isRequired bool default false, description?` | `201` `409 code` |
| List attributes | GET | `/api/v1/attributes` | `attribute:read` | `page/limit/search/dataType/isRequired sortBy` | `200` |
| Get attribute | GET | `/api/v1/attributes/:id` | `attribute:read` | `id` | `200` |
| Update attribute | PATCH | `/api/v1/attributes/:id` | `attribute:update` | `at least one` `400 IN_USE if changing dataType with dependent data` | `200` `409` |
| Delete attribute | DELETE | `/api/v1/attributes/:id` | `attribute:delete` | `id` `400 IN_USE` | `200` |
| Create value | POST | `/api/v1/attributes/:attributeId/values` | `attribute:create` | `{value req, displayName req, sortOrder? int, isActive? bool}` `409 duplicate for definition` | `201` |
| List values | GET | same | `attribute:read` | `id` | `200` paginated |
| Get value | GET | `/api/v1/attributes/:attributeId/values/:valueId` | `attribute:read` | `ids` | `200` |
| Update value | PATCH | same | `attribute:update` | `value? displayName? sortOrder? isActive?` | `200` |
| Delete value | DELETE | same | `attribute:delete` | `ids` `400 IN_USE` | `200` |

### 3.6 Images & Storage (F14) — src/modules/product-images/product-images.routes.js:57-124, storage.routes.js

| Feature | Method | Path | Perm | Body | Resp | Errors |
|---|---|---|---|---|---|---|
| Upload product image | POST | `/api/v1/products/:productId/images` | `product:create` | `multipart image JPEG|PNG|WebP|GIF 10MB` + fields `altText sortOrder isPrimary` multer `memoryStorage` `validateImageFile` `sanitizeFilename` key `tenants/{tenantId}/products/{productId}/{file}` | `201 {id,tenantId,productId,variantId:null,storageKey,url,altText,sortOrder,isPrimary,createdAt}` | `400 INVALID_FILE_TYPE|FILE_TOO_LARGE 404 cross-tenant` |
| Upload variant image | POST | `/api/v1/products/:productId/variants/:variantId/images` | `product:create` | same `key .../variants/{v}/{file}` ownership check | `201 variantId set` | `404 product/variant mismatch` |
| List product images | GET | `/api/v1/products/:productId/images` | `product:read` | `?page limit sortOrder` | `200 ordered by sortOrder` | `404` |
| List variant images | GET | `/api/v1/products/:productId/variants/:variantId/images` | `product:read` | `ids` | `200` |  |
| Get image meta | GET | `/api/v1/products/:productId/images/:imageId` | `product:read` | `ids` | `200` | `404` |
| Update image | PATCH | same + `/:imageId` | `product:update` | `{altText?,sortOrder?,isPrimary?}` allowlist `storageKey` ignored | `200` | `404` |
| Delete image | DELETE | same | `product:delete` | `ids DB+storage removed traversal-protected` | `200` | `403 unauthorized tenant` |
| Get image bytes | GET | `/api/v1/products/:productId/images/:imageId/file` | `product:read` | `ids stream` | `200 image/jpeg` headers `Content-Type` | `401 403 cross-tenant` |
| Signed URL | GET | `/api/v1/products/:productId/images/:imageId/signed-url` | `product:read` | `ids` | `200 {url (HMAC 900s or SigV4), expiresAt, key}` no credentials | `404` |
| Signed fetch | GET | `/api/v1/storage/signed?key=&expires=&signature=` | **none HMAC** | `key=tenants/… expires epoch signature hmac` | `200 stream` | `403 tampered|expired, 404 not found` |
| Auth file | GET | `/api/v1/storage/file?key=` | **Bearer** authenticate, tenant `assertTenantScopedKey` | `key must start tenants/{tenantId}/` | `200 stream` `403 cross-tenant` | `403` |
| Storage provider | — | — | — | `STORAGE_PROVIDER local|s3` `STORAGE_LOCAL_PATH ./storage` `.env.example:23-32` local PRIVATE no static | — | — |

### 3.7 Warehouses (F15) — src/modules/warehouses/warehouses.routes.js:18-24

| Feature | Method | Path | Perm | Body | Resp |
|---|---|---|---|---|---|
| Create | POST | `/api/v1/warehouses` | `warehouse:create` | `name 1-255 req, code 1-50 ^[A-Z0-9_-]+$ req unique, address? city? state? country? postalCode? isActive? default true isDefault? default false` | `201` `409 WAREHOUSE_CODE_EXISTS` |
| List | GET | `/api/v1/warehouses` | `warehouse:read` | `page limit search isActive isDefault sortBy createdAt|name|code sortOrder` | `200 + meta` |
| Get | GET | `/api/v1/warehouses/:id` | `warehouse:read` | `id` | `200` `404` |
| Update | PATCH | `/api/v1/warehouses/:id` | `warehouse:update` | `at least one` `isDefault` handling | `200` `409 404` |
| Delete | DELETE | `/api/v1/warehouses/:id` | `warehouse:delete` | `id soft` | `200` |

### 3.8 Inventory (F16) — src/modules/inventory/inventory.routes.js:23-32

| Feature | Method | Path | Perm | Query/Body | Resp | Errors |
|---|---|---|---|---|---|---|
| List inventory | GET | `/api/v1/inventory` | `inventory:read` | `page1 limit20 max100 warehouseId? variantId? sku max100 contains search max255 sortBy createdAt|quantity|sku default createdAt sortOrder asc|desc desc` | `200 {data:[{id,tenantId,productVariantId,warehouseId,quantity,reservedQuantity,createdAt,productVariant:{…}}],meta}` | `401 403` |
| Movements | GET | `/api/v1/inventory/movements` | `inventory:read` | `page1 limit20 max100 variantId? warehouseId? type ADJUSTMENT|TRANSFER|ORDER_RESERVATION|ORDER_RELEASE|… 9 enums from? to isoDate sortBy createdAt desc default` | `200 movements after=before+changed` |  |
| Low stock | GET | `/api/v1/inventory/low-stock` | `inventory:read` | `threshold? int default10 warehouseId? page/limit ordered ASC quantity <=threshold` | `200` |  |
| Per-variant | GET | `/api/v1/inventory/variants/:variantId` | `inventory:read` | `variantId + page/limit/warehouseId` | `200 per-warehouse` | `404 VARIANT_NOT_FOUND cross-tenant` |
| Adjust | POST | `/api/v1/inventory/adjust` | `inventory:update` | `{variantId|productVariantId:uuid req, warehouseId:uuid req, quantityChanged:int non-zero req, reason? max500, referenceType? referenceId?}` | `200 {inventory,movement:{type:ADJUSTMENT quantityBefore/Changed/After reason createdBy}}` `SELECT FOR UPDATE sorted retry 40001` | `400 INSUFFICIENT_STOCK (after<0) 404 variant|warehouse` |
| Transfer | POST | `/api/v1/inventory/transfer` | `inventory:update` | `{variantId:uuid req, sourceWarehouseId|warehouseId req, destinationWarehouseId|destWarehouseId req, quantity:int positive req, reason?}` atomic 2 movements `TRANSFER` same `referenceId` | `200 {sourceInventory,destInventory,movements:[2]}` sorted locks | `400 SAME_WAREHOUSE INSUFFICIENT_STOCK 404` |

**Realtime:** `inventory.low_stock` via `realtime.service.js:143`.

### 3.9 Orders (F17/F30) — src/modules/orders/orders.routes.js:19-27

| Feature | Method | Path | Perm | Body/Query | Resp | Errors |
|---|---|---|---|---|---|---|
| Create order | POST | `/api/v1/orders` | `order:create` | `{customerId:uuid req must exist tenant, items:[{productVariantId|variantId uuid req, warehouseId:uuid req, quantity:int positive req, discount? decimalString tax?}] min1 req, shippingTotal? decimalString currency? 3 default USD metadata? productId? FORBIDDEN 400} strict server derives `unitPrice=variant.price` `lineTotal=price*qty−discount+tax` `subtotal/total` Decimal` | `201 {id,tenantId,customerId,status:PENDING,subtotal,discountTotal,taxTotal,shippingTotal,total,currency,metadata,createdAt,items:[{productNameSnapshot,variantNameSnapshot,attributeSnapshot,skuSnapshot,unitPrice,quantity,discount,tax,lineTotal}],customer:{…},statusHistory:[{fromStatus:null,toStatus:PENDING}]}` | `400 INSUFFICIENT_STOCK INVALID_STATUS/productId forbidden, 404 CUSTOMER_NOT_FOUND|PRODUCT_NOT_FOUND` atomic `ORDER_RESERVATION` locks |
| List orders | GET | `/api/v1/orders` | `order:read` | `page1 limit20 max100 status DRAFT|PENDING|CONFIRMED|PROCESSING|SHIPPED|DELIVERED|CANCELLED|REFUNDED|PARTIALLY_REFUNDED customerId? sortBy createdAt|updatedAt|total|status default createdAt sortOrder asc|desc desc` selective fields compression | `200 {data[],meta}` | `401 403` |
| Get order | GET | `/api/v1/orders/:id` | `order:read` | `id` | `200 with items snapshots+customer+statusHistory` | `404 cross-tenant` |
| Update status | PATCH | `/api/v1/orders/:id/status` | `order:update` | `{status:enum req, reason? max500}` state-machine `isValidOrderTransition` | `200 with updated status+history` | `400 INVALID_STATUS_TRANSITION` |
| Cancel | POST | `/api/v1/orders/:id/cancel` | `order:cancel` | `{reason? max500}` | `200 status:CANCELLED + ORDER_RELEASE per reservation` | `400 CANCELLATION_NOT_ALLOWED (SHIPPED|DELIVERED|terminal) double cancel 400` |
| History | GET | `/api/v1/orders/:id/history` | `order:read` | `id + page1 limit20` chronological | `200 [{fromStatus nullable,toStatus,reason,createdBy,createdAt}]` | `404` |

State machine: `PENDING→CONFIRMED|CANCELLED`; `CONFIRMED→PROCESSING|CANCELLED`; `PROCESSING→SHIPPED|CANCELLED`; `SHIPPED→DELIVERED`; `DELIVERED→REFUNDED|PARTIALLY_REFUNDED` via payments; `CANCELLED|REFUNDED` terminal. DRAFT not created via public POST. Realtime `order.created|updated` `realtime.service.js:135-138`.

### 3.10 Payments (F18) — src/modules/payments/payments.routes.js:34-43

| Feature | Method | Path | Auth | Perm | Body/Params | Resp | Errors |
|---|---|---|---|---|---|---|---|
| Create | POST | `/api/v1/payments/create` | Bearer | `payment:create` | `{orderId:uuid strict req, provider? max50, currency? 3, metadata? record} .strict() rejects amount/status 400` derive `amount=order.total string toFixed2` | `201 {id,tenantId,orderId,amount server-derived,currency,status:PENDING,provider,providerPaymentId:pay_<uuid>,transactions:[{type:CHARGE,status:PENDING}],refunds:[],order}` | `400 Zod strict, 400 ORDER_ELIGIBLE_STATUSES (must PENDING/CONFIRMED/PROCESSING/DRAFT), 400 PAYMENT_ALREADY_PENDING duplicate pending, 404 ORDER_NOT_FOUND cross-tenant` |
| Confirm | POST | `/api/v1/payments/confirm` | Bearer | `payment:confirm` | `{paymentId:uuid req, providerPaymentId? max255, simulateFailure? bool} .strict()` | `200 {payment status COMPLETED|FAILED + transactions appended}` | `400 INVALID_STATE_TRANSITION (must PENDING|PROCESSING) 404` |
| Webhook | POST | `/api/v1/payments/webhook` | **public HMAC** no Bearer | — | **headers** `x-webhook-signature` or `x-payment-signature` HMAC-SHA256 required + body `{eventId 1-255 req, type payment.succeeded|payment.failed|payment.refunded|charge.succeeded|charge.failed req, paymentId? uuid, providerPaymentId? max255, amount? decimalString currency? tenantId? metadata?} .strict()` rawBody preserved | `200 {success true, duplicate:bool,processed:bool}` idempotent `@@unique([tenantId,eventId])` duplicate `P2002→duplicate:true safely ignored` 5 parallel identical →1 effect maps type→targetStatus only if validTransition locks dedup providerTransactionId | `400 Zod malformed, 401 INVALID_WEBHOOK_SIGNATURE timingSafeEqual, 429 webhookLimiter 100/1m` NOT called by frontend |
| Get | GET | `/api/v1/payments/:id` | Bearer | `payment:read` | `id` | `200 {payment+transactions+refunds+order}` | `404 cross-tenant` |
| Refund | POST | `/api/v1/payments/:id/refund` | Bearer | `payment:refund` | `{amount decimalString req, reason? max500, metadata?} .strict()` | `200 {refund, payment PARTIALLY_REFUNDED|REFUNDED}` | `400 Zod, 400 INVALID_STATE must COMPLETED|PARTIALLY_REFUNDED, 400 EXCESSIVE_REFUND (refundable=amount−sum(COMPLETED) cents), 404` |

Money `Decimal(12,2)` never Float; provider `mock|http` `PAYMENT_PROVIDER` `PAYMENT_WEBHOOK_SECRET` HMAC.

### 3.11 Audit & Activity (F24) — src/modules/audit/audit.routes.js:19-26

| Feature | Method | Path | Perm | Query | Resp |
|---|---|---|---|---|---|
| Audit logs | GET | `/api/v1/audit-logs` | `audit:read` | `page1 limit20 max100 action CREATE|UPDATE|DELETE|LOGIN|LOGOUT|EXPORT|IMPORT resource resourceId userId from isoDate to isoDate sortBy createdAt sortOrder desc` | `200 {data:[{id,tenantId,userId,action,resource,resourceId,oldValue,newValue,ipAddress,userAgent,createdAt}],meta}` sanitized `[REDACTED]` 27 keys |
| Activity logs | GET | `/api/v1/activity-logs` | `activity:read` | `page1 limit20 max100 action string userId? from? to?` | `200` similar |
| Activity detail | GET | `/api/v1/activity-logs/:id` | `activity:read` | `id uuid` | `200 single` `404 cross-tenant` |

### 3.12 Notifications (F21) — src/modules/notifications/notifications.routes.js:20-28

| Feature | Method | Path | Perm | Query/Body | Resp |
|---|---|---|---|---|---|
| List notifications | GET | `/api/v1/notifications` | `notification:read` | `page1 limit20 max100 isRead bool type INFO|SUCCESS|WARNING|ERROR channel IN_APP|EMAIL|SMS|PUSH sortBy createdAt desc` tenant/user newest-first `userId nullable tenant-wide` | `200 {data:[{id,tenantId,userId,type,title,message,channel,referenceType,referenceId,isRead,readAt,metadata,createdAt}],meta}` |
| Mark read | PATCH | `/api/v1/notifications/:id/read` | `notification:update` | `id` idempotent | `200 {isRead true}` `404 other tenant` |
| Mark all read | POST | `/api/v1/notifications/read-all` | `notification:update` | — | `200 marks all visible read` |
| Get preferences | GET | `/api/v1/notification-preferences` | `notification:read` | — | `200 [{id,tenantId,userId,channel,isEnabled,createdAt}]` 4 defaults `IN_APP|EMAIL|SMS|PUSH` synthesized if missing |
| Update preferences | PATCH | `/api/v1/notification-preferences` | `notification:update` | `{preferences:[{channel:enum req, isEnabled:bool req}]}` upsert per channel | `200 updated` |

No `/notifications/unread-count` — use `?isRead=false` meta total.

### 3.13 Jobs (F22 supporting) — src/modules/jobs/jobs.routes.js:27-36

| Feature | Method | Path | Auth | Perm | Body | Resp |
|---|---|---|---|---|---|---|
| Status | GET | `/api/v1/jobs/status` | Bearer | — (any authenticated) | — | `200 {enabled:bool workersStarted:bool queues:[notification,cleanup,webhook,email,report,analytics]}` |
| Enqueue notification | POST | `/api/v1/jobs/notifications` | Bearer | — | `{title req, message req, channel? enum, userId? uuid, referenceType? referenceId? metadata?}` tenantId derived | `202 {jobId,queued:true}` else `200 fallback sync` when Redis unavailable |
| Cleanup | POST | `/api/v1/jobs/cleanup` | Bearer | — | `{}` tenant derived | `202|200` |
| Reports | POST | `/api/v1/jobs/reports` | Bearer | — | `{…}` stub Phase 18 | `202 deferred` |
| Analytics enqueue | POST | `/api/v1/jobs/analytics` | Bearer | — | `{…}` stub | `202 deferred` |

Queues `notification 3×exp1000`, `cleanup 2×exp2000`, `webhook 5×exp1000`, `email 3×exp1000`, `report|analytics 2×exp2000` prefix `pulseops:v1:queue` retain completed `3600s` failed `24h` worker `webhook10 cleanup1 others5 lock30s`.

### 3.14 Dashboard & Analytics (F09/F23) — src/modules/dashboard/dashboard.routes.js:10, analytics.routes.js:33-40

| Feature | Method | Path | Perm | Query | Header | Resp |
|---|---|---|---|---|---|---|
| Overview | GET | `/api/v1/dashboard/overview` | `dashboard:read` | — tenant via JWT | `x-cache HIT|MISS TTL 60s key pulseops:v1:tenant:{tenant}:dashboard:overview` | `200 aggregated 6 domains Promise.allSettled partial failures` `403 no perm 401 unauth` |
| Analytics overview | GET | `/api/v1/analytics/overview` | `analytics:read` | `from? YYYY-MM-DD to? groupBy? day|week|month default day` | `x-cache TTL 300` | `200` |
| Sales | GET | `/api/v1/analytics/sales` | `analytics:read` | `from/to/groupBy + category? uuid product? uuid status? enum page1 limit20 max100 TTL 180` | `x-cache` |  |
| Orders | GET | `/api/v1/analytics/orders` | `analytics:read` | `from/to/groupBy + status page/limit TTL 180` |  |  |
| Inventory | GET | `/api/v1/analytics/inventory` | `analytics:read` | `warehouseId? category? product? status? page/limit TTL 180` |  |  |
| Customers | GET | `/api/v1/analytics/customers` | `analytics:read` | `from/to/groupBy page/limit top customers TTL 180` |  |  |
| Revenue | GET | `/api/v1/analytics/revenue` | `analytics:read` | `from/to/groupBy gross/refund/net TTL 180` |  |  |

Tenant-isolated `req.context.tenantId + authorize`, `date_trunc(... AT TIME ZONE UTC)`, money `toFixed2`, `CacheService` `analytics:{tenant}:{metric}:{hash}`.

### 3.15 Realtime (F22) — src/realtime/socket.server.js, socket.auth.js, realtime.service.js

| Aspect | Details |
|---|---|
| Connection | `new Server(httpServer,{cors:{origin:CORS_ORIGINS,credentials:true},serveClient:false})` shares HTTP `src/realtime/socket.server.js:8-15` |
| Auth | `io.use(socketAuthMiddleware)` before connect; extracts `auth.token|Authorization Bearer|query.token` `socket.auth.js:5-23`, verifies HS256 `issuer:pulseops` + `sub/tenantId/sessionId` exists (`jwt.util.js:39-56`), loads user ACTIVE + tenant ACTIVE|TRIAL (`auth.middleware.js:28-44`), stores `socket.context={userId,tenantId,sessionId,email}` server-derived |
| Rooms | Auto-join `tenant:{tenantId}` + `user:{userId}` `socket.server.js:25-28` emit `connected {userId,tenantId,rooms}`; `join|subscribe` handler strict `allowedRooms Set([tenant:{t}, user:{u}])` else `FORBIDDEN` `52-58` |
| Events | `order.created` `order.updated` `inventory.low_stock` `payment.completed` `notification.created` `ALLOWED_EVENTS Set(REALTIME_EVENTS)` `realtime.service.js:59-67`; helpers `emitOrderCreated|Updated|InventoryLowStock|PaymentCompleted|NotificationCreated`; tenant `io.to(`tenant:${tenantId}`)` else user `io.to(`user:${userId}`)` |
| Envelope | `{event,data:sanitizePayload,tenantId,timestamp:ISO}` `110-114` `sanitizePayload` blocks `password|passwordHash|hash|refreshToken|accessToken|token|secret|apiSecret|webhookSecret|providerSecret|credentials|authorization|cookie` + pattern `password|secret|credential|authorization|cookie|refresh_token|access_token` strips `stack` |
| Frontend use | `socket.io-client` with `auth:{token}` or `Authorization` header; listen 5 events to update Dashboard/Orders/Inventory/Payments/Notifications with `Toast` + widget refresh |

### 3.16 Health/Readiness/Metrics/Swagger (public)

| Method | Path | Auth | Resp | Notes |
|---|---|---|---|---|
| GET | `/health`, `/api/v1/health` | none | `200 {success:true,data:{status:"ok"}}` liveness no DB/Redis always 200 | `src/modules/health/health.routes.js` |
| GET | `/health/db`, `/api/v1/health/db` | none | `200 up` or `503 {name:database,status:down}` `SELECT 1` | |
| GET | `/health/redis`, `/api/v1/health/redis` | none | `200 PONG` or `503` | |
| GET | `/ready` | none | composite infra readiness `503` when down | `src/modules/readiness/readiness.routes.js` |
| GET | `/metrics` | none | Prometheus-style | `src/modules/metrics/metrics.routes.js` |
| GET | `/api-docs/`, `/api-docs.json`, `/openapi.json`, `/api/v1/openapi.json` | none | Swagger UI / `openapi:3.0.3` spec `$ref` resolved 81 paths | `src/docs/openapi.js` |

Rate limits `RateLimit-Policy` draft-8 `Retry-After` on `429`.

---

## 4. Backend Dependency Register

Explicitly separated from frontend implementation — must not invent.

| # | Requirement | Roadmap § | Current Backend | Impact on Frontend Execution Order |
|---|---|---|---|---|
| 1 | **Tenant list / discovery** `GET /tenants?page&search&status` | §13 F08, §38 F31, §53 | `NOT AVAILABLE` — only `POST|GET/:id|PATCH/:id|DELETE/:id` public (`tenants.routes.js:33-38`, `src/docs/paths/tenants.js`) | F08/F31/F32 platform tenant table blocked. UI can be designed but list data BLOCKED. Workaround: tenant per login via `auth/me.tenantId` + `GET /tenants/:id` per id only. |
| 2 | **Tenant switching** `POST /switch-tenant` / `POST /auth/switch-tenant` | §13 F08, §53 | `NOT AVAILABLE` — no route, `authenticate` derives `tenantId` from JWT only (`auth.middleware.js:50`) | Multi-tenant user unsupported; frontend must use single-tenant login per tenant (login form hidden `tenantId` from URL `?tenantId=` or subdomain). |
| 3 | **Tenant membership listing** `GET /users/me/tenants` / `GET /tenant-memberships` | §13 F08, §53 | `NOT AVAILABLE` — `TenantMembership` model exists (`prisma:232`) but no REST exposure | Tenant picker BLOCKED. |
| 4 | **Customer CRUD** `GET|POST|PATCH|DELETE /customers` + `GET /customers/:id` | §30 F25, §53 | `NOT AVAILABLE` — model exists (`Customer:682` `@@unique([tenantId,email])`) but **no** `customersRouter` (`src/app/routes.js` none). Used only as `POST /orders {customerId}` validation `404 CUSTOMER_NOT_FOUND`. | F25 BLOCKED. Orders must reference pre-seeded customers (seed via Prisma). UI designed un-wired. |
| 5 | **Customer storefront auth/API** `POST /store/auth/register|login` + public `GET /store/products` + `GET /store/categories` | §31-33 F26, §53 | `NOT AVAILABLE` — `GET /products` requires `product:read` Bearer (`products.routes.js:46`); no public storefront path; `grep storefront\|CustomerAuth` zero | F26 discovery + cart (F27) + checkout (F28) + account (F29) BLOCKED for anonymous shoppers. Can build UI shells against `GET /products` with admin token for demo but not as public storefront. |
| 6 | **Cart** `POST /cart`, `PUT /cart/items/:id`, `DELETE /cart` | §34 F27 | `NOT AVAILABLE` — no cart model (`prisma` none) | F27 local-only state; server stock validation unavailable for anonymous. |
| 7 | **Checkout** `POST /checkout` with `delivery|currency|payment` orchestration | §35 F28 | `NOT AVAILABLE` as dedicated checkout — only `POST /orders` admin creation + `POST /payments/create|confirm`. Anonymous checkout + customer creation missing; F28 partially via existing ops if customer pre-exists | F28 BLOCKED unless customer seeded. |
| 8 | **Authenticated password change** `PUT /auth/change-password` (while logged-in) | §53 row 7 | `NOT AVAILABLE` — only reset flow; `PATCH /users/:id` rejects `passwordHash` `400 PASSWORD_MODIFICATION_FORBIDDEN` (`users` validation) | Login form must offer only forgot/reset link. |
| 9 | **Remove user role** `DELETE /users/:id/roles/:roleId` | §25 F20, §53 row 8 | `NOT AVAILABLE` — only `GET|POST /users/:id/roles` (`users.routes.js:50-51`) | F20 partially supported; UI must not fake DELETE. |
| 10 | **Remove role permission** `DELETE /roles/:id/permissions/:permissionId` | §25 F20, §53 row 9 | `NOT AVAILABLE` — only `POST /roles/:id/permissions` replaces (`roles.routes.js:47`) | Same. |
| 11 | **Notification template management** `GET|POST|PATCH|DELETE /notification-templates` | §53 row 10, `NotificationTemplate` model exists `prisma:895` | `NOT AVAILABLE` — no routes (`src/app/routes.js` none) | Preferences (4 channels) work; template CRUD BLOCKED. |
| 12 | **Full report export** `GET /reports|analytics/export` csv/pdf | §53 row 11 | `NOT AVAILABLE` — only `POST /jobs/reports|analytics` `202 deferred stub` (`jobs.routes.js:35-36`) no processing | Analytics charts work; export button BLOCKED. |
| 13 | **S3 / presigned functionality gaps** `GET /storage/presigned` extended | §53 row 12 | `GAP` — local provider `tenants/{t}/…` + HMAC `900s` exists, but S3 SigV4 `GET /products/:…/signed-url` exists yet some `presigned` listing not fully wired | F14 works locally; S3-specific extended listing is gap not blocker. |
| 14 | **Platform admin API routes** `GET|POST /platform|/platform/tenants|/subscriptions|/users|/audit|/system` + impersonation | §38-41 F31-F33, §53 row 13 | `NOT AVAILABLE` — `PlatformRole|Permission|UserRole` models exist but `authorizePlatform` never mounted (`authorization.middleware.js:72-86`) no `platformRouter`. | F31-F33 all BLOCKED except design architecture; actual `POST /tenants` public provisioning is not platform-guarded. |
| 15 | **Tenant impersonation / workspace entry** `POST /platform/tenants/:id/impersonate` | §41 F33 | `NOT AVAILABLE` | F33 BLOCKED — roadmap warns never spoof tenantId. |
| 16 | **Global email uniqueness vs tenant-scoped** | `prisma/schema.prisma:201` `User @@unique([email])` global + `@@unique([tenantId,email])` | **GAP / DISCREPANCY** — handoff claims cross-tenant same email `201` allowed, but DB global unique forces `409`. Needs backend clarification before multi-tenant email UX. | Users docs must note until fixed, recommend unique email per global. See §7.4. |

All above must become `precise backend dependency backlog` — separate from frontend, not invented via mock endpoints.

---

## 5. Security Review

Frontend architecture must never weaken these guarantees — backend is authoritative.

| Requirement | Status | Verified Backend Evidence | Frontend Implication |
|---|---|---|---|
| **No trust client-side permissions** | ✅ | `authorize(permission)` checks `membership ACTIVE` + `getUserPermissions` DB + cache TTL 300s, 403 if missing (`authorization.middleware.js:8-49`), 401 if JWT invalid/expired (`auth.middleware.js:56-60`). Every protected route includes `authenticate()+authorize(...)` (`*.routes.js`). | Frontend `Can()`/guards are **display-only** for hiding buttons; must not bypass. Every write must expect `403` fallback even if UI hidden; show polished 403 page. Do not decode JWT client claims for authorization decisions. |
| **No tenant spoofing** | ✅ | `tenantId` only from verified JWT `decoded.tenantId` (`auth.middleware.js:50`, `socket.auth.js:80` `socket.context`), all repos `where:{tenantId}`, storage `assertTenantScopedKey` `tenants/{tenantId}/…` traversal protected, socket `allowedRooms` guard (`socket.server.js:52-58`), order client `tenantId` stripped. | Frontend must **never** send `X-Tenant-Id` header or body `tenantId` for isolation (ignored). Tenant display via `auth/me` + `GET /tenants/:id` public only for UI. Switching by putting another `tenantId` in request forbidden — awaits platform impersonation backend. |
| **No secrets in client bundle** | ✅ | `NOT AVAILABLE` for client secrets; env secrets (`JWT_ACCESS_SECRET min32 prod`, `DATABASE_URL`, `PAYMENT_WEBHOOK_SECRET`, S3 keys) required `env.js:38-58` `FAIL_ON_DEPENDENCY_ERROR prod`; dev defaults `test-access-secret-min-32…` not for prod. | Frontend `NEXT_PUBLIC_` only: `NEXT_PUBLIC_API_URL` (`http://localhost:3000`) + `NEXT_PUBLIC_SOCKET_URL` (same host) + `NEXT_PUBLIC_APP_URL`. Never expose JWT secrets, `PAYMENT_WEBHOOK_SECRET`, DB/Redis URLs, S3 `SECRET_ACCESS_KEY`, `INTERNAL_API_KEY`. Use server-only `env` for SSR if needed. |
| **No payment amount manipulation** | ✅ | `POST /payments/create .strict()` rejects unknown `amount/status` `400` (`payments.routes.js:40` `payments.validation.js`), derives `amount=order.total server Decimal toFixed2` (`PULSEOPS_FRONTEND_BACKEND_HANDOFF.md:88`), `GET /payments/:id` returns authoritative amount, `refundable=amount−sum(COMPLETED)` `EXCESSIVE_REFUND` guard. | Frontend must **display** server `amount` string only; never compute totals for authority (checkout summary may show interim calc but must not submit). Disable Create after first success; duplicate pending guard `400 PAYMENT_ALREADY_PENDING`. No client `amount` field in API client wrapper. |
| **No bypass backend authorization** | ✅ | 96 protected ops require `Bearer` else `401 UNAUTHORIZED`; socket same; webhook `timingSafeEqual` HMAC (`401 INVALID_WEBHOOK_SIGNATURE`). Cross-tenant returns `404` not `403` to avoid enumeration but still blocked. `isSystem` roles `403 SYSTEM_ROLE_IMMUTABLE`. | Frontend must implement `401 → refresh → retry once → login` without infinite loops; `403 → /403`; `404 cross-tenant` as not found not switchable. Raw webhook `POST /payments/webhook` **never called from frontend** — provider-only. |
| **No tenant data leakage** | ✅ | Tenant isolation `where:{tenantId}` + `membership` checks + `@@unique([tenantId,…])` + cache keys `tenant:{tenantId}:…` (`CacheService` hashing `sha256 16`), realtime rooms tenant-scoped, audit sanitized `[REDACTED]` 27 keys (`realtime.service.js:3-33` + audit module). | Frontend caching (React Query/SWR) must include `tenantId` in key; clear all queries on logout/tenant mismatch; never cache cross-tenant. NotFound boundary must not reveal existence. |
| **No sensitive information exposure** | ✅ | `sanitizePayload` redacts `password|passwordHash|hash|refreshToken|accessToken|secret|authorization|cookie` etc; truncates `stack`; user GET never exposes `passwordHash`; reset/forgot `enumeration-safe` always `200`. | Frontend must not log tokens/passwords, not render `error.details.passwordHash`, truncate long errors, display `Request ID …` from `X-Request-Id` not internal stack. Never render webhook HMAC or raw `refreshToken` beyond login memory. Search `search?` is `contains insensitive` — ensure no XSS via raw backend HTML (sanitize). |
| **No unsafe redirects** | ✅ | No open-redirect params in backend; `CORS` explicit allowlist with `credentials:true` only for allowed origins (`src/app/app.js:43-54` `env.js:87-94` prod rejects `*`). | Frontend must allowlist redirect after login (`?next=/dashboard` only within same origin, validate startsWith `/` not `//` or `http`), never redirect to `?redirect=http://attacker`. Login `next` param sanitized. |
| **No unsafe error details** | ✅ | Error envelope `{success:false,error:{code,message,details},requestId}` with `Zod` details only, `requestId` uuid, `401/403/404/409/429` codes standardized; internal `500` sanitized via `errorHandler` no leak. | Frontend must render `error.message` not `error.stack`, show `Request ID` for support, map `409 TENANT_SLUG_EXISTS → friendly`, `400 CYCLE_DETECTED|HAS_CHILDREN|INSUFFICIENT_STOCK|SAME_WAREHOUSE|CANCELLATION_NOT_ALLOWED|EXCESSIVE_REFUND` etc to actionable UI not raw code. Do not expose `X-Request-Id` generation secret. |
| **Rate limiting respected** | ✅ | `globalLimiter 100/15m`, `authLimiter 20/15m`, `webhookLimiter 100/1m` (`src/config/env.js:30-37`) with `Retry-After` header standard. | Frontend must handle `429` with `Retry-After` countdown, disable button, show toast `Too many attempts try again inXs`. Do not retry immediately. |
| **Storage access isolation** | ✅ | `tenants/{tenantId}/…` prefix + `assertTenantScopedKey`, local PRIVATE no `express.static` (`PULSEOPS_FRONTEND_BACKEND_HANDOFF.md:67-70`), signed `900s` HMAC, `GET /storage/file?key=` tenant check `403 cross-tenant`. | Frontend must use `GET /products/:id/images/:imageId/file` or `…/signed-url` with auth header; never construct `key` client-side outside tenant prefix. Revoke expired URLs via retry signed-url. |

All security checks PASS with backend as authoritative — frontend must respect but actual enforcement remains server-side.

---

## 6. Human Verification Plan — Per Major Phase

> Agent provides automated evidence (lint/type-check/build/tests/API integration) and marks `IMPLEMENTED` or `AUTOMATED VERIFIED`. Human must perform manual checks below in **real browser + real backend running** (`docker-compose up`, seeded Tenant/User, valid JWT). Record in `PHASE##_HUMAN_VERIFICATION_REPORT.md` per roadmap §54 with checklists `PASS|FAIL|BLOCKED`. Never mark `HUMAN VERIFIED|APPROVED` from automation alone.

### F01 Foundation — Human checks

- [ ] `npm run dev` serves on configured port, no console errors/hydration errors
- [ ] `npm run lint` passes (no errors)
- [ ] `npm run build` succeeds (`next build` output clean, no type errors `npx tsc --noEmit`)
- [ ] `NEXT_PUBLIC_API_URL=http://localhost:3000` reachable via `fetch /health` in browser network tab
- [ ] Metadata/favicons resolve, global CSS + design tokens applied, responsive root layout no overflow
- [ ] Error boundaries render on thrown error, `not-found.tsx` shows 404, loading.tsx skeleton shows on suspense
- **BLOCKED if:** `node_modules` missing, `.env` not set, backend `docker-compose` not healthy (`GET /health` 503)

### F02 Design System — Human checks

- [ ] Storybook or `/design-system` demo page renders all primitives (Button variants/sizes, Input error state, Select/Combobox keyboard navigation, DatePicker, Badge, Card, Modal/Drawer focus trap, Tabs ARIA, Pagination, Skeleton, EmptyState, Alert/Toast, Breadcrumb, SearchBar, CommandMenu)
- [ ] No module creates random button/table/card styling — visual regression against tokens (spacing/radius/shadow)
- [ ] Keyboard: `Tab` order, `Esc` closes dialogs, visible focus ring, contrast ≥ 4.5:1 (axe)
- [ ] Mobile/Tablet/Desktop layouts for primitives — tables use card fallback not overflow
- **Evidence:** screenshots widths `320|768|1024|1440`

### F03 Application Shell — Human checks

- [ ] Root/Tenant/Platform/Storefront layouts render correctly; wrong workspace redirects not 500
- [ ] Tenant shell shows `Logo | Tenant name (from GET /tenants/:id) | Notifications bell count | Search | User avatar dropdown (Profile/Logout)`
- [ ] Navigation groups `Overview|Catalog|Inventory|Orders|Customers*|Payments|Analytics|Administration|Settings` hide where permission missing (member vs manager vs admin)
- [ ] Sidebar collapses mobile → bottom nav (`BottomNavigation`) with `☰` hamburger, topbar sticky
- [ ] Theme toggle persists, no hydration mismatch
- **BLOCKED if:** `GET /auth/me` 401 with fresh token (see F06)

### F04 API Client & Data Layer — Human checks

- [ ] Network tab: no raw `fetch("http://localhost:3000/api/v1…")` without wrapper — all via `lib/api/client` with `Authorization` and `X-Request-Id`
- [ ] `401 TOKEN_EXPIRED` triggers exactly **one** `POST /auth/refresh` then retries original once — failure goes to `/login` (verify via expired accessToken manually)
- [ ] `429` shows `Retry-After` toast and does not infinite-retry
- [ ] Pagination calls send `?page&limit` and consume `meta.total|totalPages`; filter query serialization correct (`?categoryId=uuid`)
- [ ] Error toast shows `error.code` friendly message + `Request ID: <uuid>`
- [ ] `GET /products` `x-cache` HIT on second identical call if enabled

### F05/F06 Authentication + Session — Human checks

- [ ] `/login` valid credentials → stores `accessToken` (memory) + `refreshToken` (secure persistence) + redirects to `?next|/dashboard`; network shows `200 login` then `GET /auth/me` 200
- [ ] `/register` with `tenantId` param validates `password 8-128 upper|lower|number|special` (Zod error per field) and shows success; duplicate `201` cross-tenant vs `409 USER_ALREADY_EXISTS` same tenant correctly handled
- [ ] `/forgot-password` enumeration-safe: valid or invalid email both `200 If email exists…`; `devToken` hidden in prod (`NODE_ENV production` shows no `devToken`)
- [ ] `/reset-password` with `token` from forgot devToken (dev) succeeds; reused token → `400 RESET_TOKEN_USED`; expired (>1h) → `400 RESET_TOKEN_EXPIRED`; weak password fails regex
- [ ] `/verify-email` with token → `200 Email verified`; reuse → `400 USED`
- [ ] Logout clears both tokens + cache and redirects to `/login`; `POST /auth/logout` 200 even with invalid token
- [ ] Expired accessToken (wait 15m or mock short expiry) → next API call 401 → refresh → 200; refresh expired → 401 → cleared → `/login`
- [ ] Protected route without token → `/login?next=/dashboard`; forbidden with wrong perm → `/403` polished not raw error
- [ ] `authLimiter 20/15m`: 21st fast forgot `429` with `Retry-After`
- **BLOCKED if:** backend `GET /ready` 503, or cross-tenant login returns wrong `tenantId`

### F07 RBAC & Permissions — Human checks

- [ ] Admin sees all nav items; member sees `product:read` but not `Create Product` button (`Can resource="product" action="create"` hides)
- [ ] Direct navigation to forbidden path (e.g., member `GET /admin/roles`) server returns `403` and UI shows polished 403 page, not blank
- [ ] Role list pagination `page1 limit50`; permission matrix `Read|Create|Update|Delete` ✓/− correct per `admin|manager|member`
- [ ] Assigning `role:update` with permissionIds works; attempting delete of permission (no endpoint) not shown as button (no fake DELETE)
- [ ] `GET /users/:id/roles` badge shows `isSystem` correctly; `DELETE /roles/:id` on `isSystem` → `403 SYSTEM_ROLE_IMMUTABLE` toast
- [ ] After `POST /users/:id/roles` invalidates `getUserPermissions` — re-check `Can()` updates without reload

### F08 Tenant Context — Human checks

- [ ] Logged-in header shows tenant name from `GET /tenants/:id` (public) matching `jwt tenantId`; no tenant picker shown (dependency documented)
- [ ] Attempt to `GET /tenants` list returns `404` (not exposed) — frontend does not call it (network tab clean)
- [ ] Manual manipulate `Authorization` with another `tenantId` → `401 INVALID_TOKEN_CLAIMS|USER_NOT_FOUND` — UI shows unauthorized not leaked data
- **BLOCKED if:** need to verify multi-tenant switching — expected BLOCKED until backend provides `GET /tenants` list + `POST /switch-tenant`

### F09 Dashboard — Human checks

- [ ] `/dashboard` loads `GET /dashboard/overview` `200` with `x-cache MISS` first then `HIT`; partial failure of one domain still shows others (Promise.allSettled behavior)
- [ ] KPI section `Revenue|Orders|Products|Inventory|Customers|Payments` cards hierarchy primary→main chart→operational widgets→recent activity
- [ ] Revenue chart + Orders chart + status distribution + low-stock alerts + recent orders + recent activity all populated or show correct empty state
- [ ] `401` with missing `dashboard:read` → 403 page

### F10-F14 Catalog (Products/Categories/Attributes/Images) — Human checks

- [ ] `/products` list search debounced, filters `Status|Category|Price` + `sku/barcode` contains + `attributeFilters` work combined, `sortBy` + `sortOrder` persist in URL query, pagination `page|limit` + meta
- [ ] `GET /products?search=phone` returns correct results (insensitive); empty `No products yet [Add Product]` when zero
- [ ] Product `POST` with `name basePrice status` 201; validation `409 SKU_EXISTS` shows field error; soft delete → list excludes but `GET /products/:id` 404?
- [ ] Detail tabs `Overview|Details|Variants|Attributes|Images|Inventory|Activity` switching no full page reload; variant `POST` with `sku price` `201` then appears
- [ ] Category tree `Electronics → Phones → Android|iPhone` drag parent selection cycle rejected `400 CYCLE_DETECTED`, `DELETE` with children `400 HAS_CHILDREN`
- [ ] Attribute `POST code ^[a-z0-9_-]+$` `409 duplicate`; `OPTIONS` uses values CRUD `POST|GET|PATCH|DELETE /attributes/:id/values`; in-use `400 IN_USE` on delete
- [ ] Image upload drag-drop 10MB JPEG/PNG/WebP/GIF preview → 201 → `GET .../file` renders, signed-url expires `900s` then retry works, delete removes bytes, `isPrimary` toggle, reorder `sortOrder` persists

### F15-F16 Warehouses & Inventory — Human checks

- [ ] `/admin/warehouses` create `code ^[A-Z0-9_-]+$` `409` if duplicate, toggle `isDefault|isActive`, soft delete
- [ ] `/inventory` health `Total|Reserved|Available|Low stock|Out of stock` cards correct from `GET /inventory` sums
- [ ] Table `Product SKU Warehouse Quantity Reserved Available Status` filters `warehouseId|variantId|sku|search`; sort `quantity|sku`
- [ ] Adjust modal `quantityChanged !=0` positive adds negative subtracts, `INSUFFICIENT_STOCK` toast, after refresh `quantity` correct, movement `ADJUSTMENT` appears in `/inventory/movements` with `quantityBefore/Changed/After` invariant
- [ ] Transfer modal `source≠dest` else `400 SAME_WAREHOUSE`; insufficient `400 INSUFFICIENT_STOCK`; success atomic 2 `TRANSFER` same `referenceId` both appear
- [ ] Low-stock `threshold default10` page shows `quantity <= threshold` ASC
- [ ] Movements pagination + type filter `ADJUSTMENT|TRANSFER|ORDER_RESERVATION` etc chronological

### F17 Orders — Human checks

- [ ] `/orders` list filters `status customerId search` sort `createdAt|updatedAt|total|status`; pagination meta
- [ ] `/orders/new` rejects `productId` with `400 productId is not allowed`; requires `customerId` existing else `404 CUSTOMER_NOT_FOUND` (seed customer first)
- [ ] Create with `items [{productVariantId, warehouseId, quantity}]` server derives `unitPrice=variant.price` and `total` Decimal `2598.00` for 2×1299.00 — frontend must not submit client `amount`
- [ ] Order detail `Header|Customer|Items|Pricing|Payment|Status|History`; totals string `toFixed2`
- [ ] Status stepper `PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED` visual; invalid transition → `400 INVALID_STATUS_TRANSITION`
- [ ] Cancel `POST /:id/cancel` before `SHIPPED` succeeds `CANCELLED` + `ORDER_RELEASE` restores inventory; second cancel or `SHIPPED` → `400 CANCELLATION_NOT_ALLOWED`; history paginated
- [ ] Realtime `order.created` appears without reload in list; `order.updated` updates stepper

### F18 Payments — Human checks

- [ ] `POST /payments/create {orderId}` derives `amount=order.total` — if client sends `amount` → `400 strict`; `paymentId pay_<uuid>` `PENDING` + `CHARGE PENDING`
- [ ] Duplicate pending on same order → `400 PAYMENT_ALREADY_PENDING` → Create button disabled
- [ ] `POST /payments/confirm {paymentId}` → `COMPLETED` (or `FAILED` if `simulateFailure true`); invalid state → `400 INVALID_STATE_TRANSITION`; frontend polls `GET /payments/:id`
- [ ] `/payments/:id` shows summary `status` badge, transaction history, `Confirm` button only when `PENDING|PROCESSING`, `Refund` dialog `amount` validation against `refundable=amount−sum(COMPLETED) cents` excessive → `400 EXCESSIVE_REFUND`; refund on non-`COMPLETED` → `400 INVALID_STATE`; result `PARTIALLY_REFUNDED|REFUNDED`
- [ ] Webhook `POST /payments/webhook` not called from browser — verify via backend logs not frontend network tab; idempotent duplicate `200 duplicate:true`
- [ ] Never allows frontend to modify server amount

### F19-F20 Users/Roles — Human checks

- [ ] `/admin/users` search debounced by `email|firstName|lastName`, filter `status roleId`, sort `createdAt|email|…` meta correct; cross-tenant user not found `404`
- [ ] Detail `GET /users/:id` shows `roles isSystem emailVerified lastLoginAt`; edit `firstName|lastName|status` only — `email` field disabled, `PATCH` with `email` → `400 EMAIL_MODIFICATION_FORBIDDEN`
- [ ] Delete own id → `400 SELF_DELETION_FORBIDDEN`; other user → `200 hard delete` then disappears
- [ ] `POST /users/:id/roles {roleIds}` assigns idempotent; no Remove button present (dependency)
- [ ] `/admin/roles` matrix `Read Create Update Delete` ✓/− per `admin|manager|member`; actual seeded counts `admin 83 links all 38 perms manager 34 member 11`
- [ ] `POST /roles` `name ^[a-z0-9_-]+$` `409`; `PATCH|DELETE` on `isSystem true` → `403 SYSTEM_ROLE_IMMUTABLE`; `POST /roles/:id/permissions` filtered cross-tenant

### F21-F24 Notifications/Realtime/Analytics/Audit — Human checks

- [ ] Bell `🔔 3` unread count from `GET /notifications?isRead=false` meta total; dropdown `New order|Payment completed|Low inventory|system` newest-first
- [ ] `/notifications` mark read single then `isRead true readAt set`; `POST read-all` idempotent; preferences `/settings/notifications` toggles per channel persist via `PATCH` 4 channels
- [ ] Socket `auth: token` connects `connected rooms:[tenant:{t},user:{u}]`; `order.created|updated` appears realtime in orders list; `inventory.low_stock` toast + widget; `payment.completed` updates payments; `notification.created` bell count increments; `join` with foreign room → `FORBIDDEN` error in console
- [ ] `/analytics` date range `from/to YYYY-MM-DD` + `groupBy day|week|month` charts `revenue|orders|inventory|customers` respond `x-cache`; `GET /analytics/sales?category=…&product=…&status=…` filters correctly
- [ ] `/admin/audit|/admin/activity` filters `action|resource|resourceId|userId|from|to` + pagination + sort; detail drawer `Before|After|IP|UserAgent|RequestId` sanitized `[REDACTED]` never shows `password|token|secret`

### F25-F30 Customer Management & Storefront — Human checks (expected BLOCKED)

- [ ] `/customers` — verify BLOCKED: no `GET /customers` data (roadmap `BACKEND DEPENDENCY`); UI may show designed empty states but network shows no API call (do not fake)
- [ ] `/store` — product grid via `product:read` requires Bearer — public anonymous fetch should FAIL 401 (expected); document as platform dependency
- [ ] `/cart` — local cart adds `variant quantity variantImage price` shows stock validation spinner but server validation `GET /inventory/variants/:variantId` 401 for anonymous → BLOCKED
- [ ] `/checkout` steps `Customer info|Delivery|Order summary|Payment|Confirmation` — order creation may succeed only if `customerId` pre-seeded with tenant Bearer; anonymous `400 CUSTOMER_NOT_FOUND` is expected BLOCKED
- [ ] `/account|/account/orders|/account/orders/:id` — BLOCKED; verify admin `/orders/:id` timeline still shows `✓ PENDING→Confirmed→…` with realtime `order.updated`

### F31-F33 Platform — Human checks (expected BLOCKED)

- [ ] `/platform|/platform/tenants|/subscriptions|/users|/audit|/system` — verify `403|404` not wired — UI must show dependency banner not dead buttons; no fake data
- [ ] Tenant create via public `POST /tenants` works per id only; list `GET /tenants` `404` as expected — table cannot populate
- [ ] Attempt `Platform → Tenant Workspace` by injecting `tenantId` query param fails with `404` or unauthorized — correct behavior

### F34-F42 Polish/Accessibility/Performance/Security/Build — Human checks

- [ ] Every major page: skeleton not blank; empty `No products yet [Add Product]`; error `We couldn't load… Request ID … [Try again]`; confirmation dialogs for destructive actions
- [ ] Responsive `320|768|1024|1440` no overflow/hydration error; tables→cards fallback; dialogs bottom-sheet mobile
- [ ] Accessibility axe run `keyboard Tab→Enter→Esc`, focus visible, dialog focus trap, table `th scope`, `aria-label` on icon buttons, contrast passes
- [ ] Performance: Lighthouse scores; `next/image` with `signed-urls` optimized, route splitting prefetch working, pagination debounced search `≈300ms`
- [ ] Security: `NEXT_PUBLIC_` bundle inspected (`grep` secrets none), CSP headers, tenant data not leaked when switching users (clear cache)
- [ ] Build: `npm run build` prod success, `NEXT_PUBLIC_API_URL` points to `http://localhost:3000` (dev) or injected prod URL; `GET /openapi.json` matches deployed version

> If any check cannot complete due to missing backend API, env, or reproducible defect, mark that checklist item `BLOCKED` with `reason: <backend dependency | env | defect>` and link to this register (#). Do not convert `BLOCKED` to `PASS`.

---

## 7. Modification Rule & Roadmap Correctness

> Instruction: Do NOT modify `PULSEOPS_FRONTEND_MASTER_ROADMAP(1).md` / `docs/PULSEOPS_FRONTEND_MASTER_ROADMAP.md` unless concrete discrepancy vs actual backend is proven, with 5-point evidence.

### Verdict: **NO MODIFICATION REQUIRED** — roadmap is correct and consistent with backend.

| Roadmap Statement | Backend Evidence | Assessment | Proposed Change | Impact |
|---|---|---|---|---|
| `115 operations, 81 path keys, 19 public/96 protected, OpenAPI 3.0.3, JWT Bearer, tenant isolation, RBAC` (§01 1.1) | `src/docs/openapi.js:93-106` 81 keys 115 ops `servers:[{url:http://localhost:3000}]`, `src/docs/paths/*.js` 19 `security:[]` | **Correct** | None | — |
| `Tenant discovery|switching|membership listing NOT AVAILABLE` (§01 1.2, §13 F08, §53) | `src/app/routes.js:27` no `GET /tenants` list, `tenants.routes.js:33-38` only `POST|GET/:id|PATCH/:id|DELETE/:id` public, `auth.middleware.js:50` JWT-only | **Correct** — must not invent | None, keep `BACKEND DEPENDENCY` warnings |
| `Customer CRUD NOT AVAILABLE, Customer storefront auth/API NOT AVAILABLE, Platform admin API routes NOT AVAILABLE, Notification template management NOT AVAILABLE, Full report export NOT AVAILABLE` (§01 1.2, §30 F25, §31 F31, §53) | `src/app/routes.js` no `/customers|/platform|/cart|/checkout` routers, grep confirms `Customer` model only via orders, `authorizePlatform` unused (`authorization.middleware.js:72-86`) | **Correct** | None | Frontend executes F25-F33 as **designed but not wired** per §31-41 |
| `Role permission removal NOT AVAILABLE, User role removal NOT AVAILABLE` (§25 F20, §53) | `roles.routes.js:47` only `POST /roles/:id/permissions`, `users.routes.js:50-51` only `GET|POST /users/:id/roles` — no DELETE endpoints (`src/docs/paths/rbac.js`) | **Correct** | None, hide fake DELETE UI |
| `Authenticated password change NOT AVAILABLE` (§53 row) | `auth.routes.js:45-57` no `PUT /auth/change-password`, `users` validation rejects `passwordHash` | **Correct** | None — forgot/reset only |
| `Some S3/presigned functionality GAP` (§53) | `src/common/storage` local PRIVATE + `GET /storage/signed|file` HMAC 900s + S3 env (`env.js:49-58`) partial | **Correct** — not blocker | None, mark `GAP` not `NOT AVAILABLE` |
| Execution order `F01→…→F42` (§56) | All upstream F01-F24 `SUPPORTED` except F08 `BACKEND DEPENDENCY`, so order holds | **Correct** | None | Proceed F01→F42 with F25-F33 as dependency backlog parallel to UX phases |

### One GAP requiring backend clarification (not a roadmap edit, but record for backlog)

| Discrepancy | Evidence | Why it matters | Recommendation |
|---|---|---|---|
| `User @@unique([email])` global vs docs claim cross-tenant same email `201` | `prisma/schema.prisma:201` `@@unique([email])` + `@@unique([tenantId,email])` both present; `src/modules/auth/auth.service.js:42` unique conflict → `409 USER_ALREADY_EXISTS` globally | Blocks multi-tenant email UX (same person with same email in two tenants) — would `409` unexpectedly in real world | Backend should either drop `@@unique([email])` to keep only `@@unique([tenantId,email])` or document cross-tenant email not allowed. Frontend: until clarified, show `This email is already registered. Use different email or contact support.` on `409`. |

No roadmap rewrite needed. Do not weaken `Human Verification Gate` (§54 lifecycle `NOT STARTED→IMPLEMENTED→AUTOMATED VERIFIED→HUMAN VERIFICATION→APPROVED→NEXT PHASE`) — keep `IMPLEMENTED ≠ APPROVED`.

---

## 8. Execution Rule — Next Steps

> `DO NOT commit/push` until human instructs; `Do not start coding until audit complete` — audit is now complete.

1. **Audit complete** — this report + `PULSEOPS_FRONTEND_BACKEND_HANDOFF.md` are source of truth.
2. **Await human `APPROVED` for audit** — human verifies this report against `src/app/routes.js`, `prisma/schema.prisma`, `src/docs/openapi.js` and confirms `SUPPORTED|BACKEND DEPENDENCY` verdicts.
3. **After approval**, proceed strictly in order (§56):
   - **F01 Foundation** → `npm init next`, `next.config.ts` env `NEXT_PUBLIC_API_URL|NEXT_PUBLIC_SOCKET_URL`, `tsconfig path aliases @/*`, `eslint`, global CSS + Tailwind + design tokens → `npm run dev|lint|build` automated verified → stop at human gate.
   - For each F-phase: implement only approved scope → wire real endpoints from §3 → run `lint|type-check|build|tests` → produce **Phase Completion Report** (`Phase|Objective|Files changed|Features|Endpoints used|Contracts|Tests|Lint/Type/Build|Limitations|Dependencies|Evidence|Items requiring HUMAN VERIFICATION|Status IMPLEMENTED|AUTOMATED VERIFIED|BLOCKED` never `HUMAN VERIFIED|APPROVED`) → await human verification report `PHASE##_HUMAN_VERIFICATION_REPORT.md` → only then `APPROVED→NEXT PHASE`.
4. **Blocked handling:** When human marks `BLOCKED` per gate, do not convert to `PASS`; record `BACKEND DEPENDENCY` backlog (#4) and either exclude scope or re-verify after backend addition.
5. **Git:** No commit/push until `I explicitly instruct you to do so` — respect exactly.

---

## 9. Appendix — File References (line-precise)

- Frontend roadmap: `docs/PULSEOPS_FRONTEND_MASTER_ROADMAP.md:1-2193` (53-58 lifecycle, 56 execution order, 53 dependency register)
- Backend handoff: `PULSEOPS_FRONTEND_BACKEND_HANDOFF.md:1-1020` (§3 envelope, §4-28 feature inventory, §19 security, §53 gaps)
- OpenAPI: `src/docs/openapi.js:14-107` (`openapi:3.0.3` `81 paths 115 ops`), `src/docs/paths/{auth,tenants,rbac,catalog,inventory-warehouses,orders-payments,audit-notifications,jobs,analytics-storage,health}.js`
- Router composition: `src/app/routes.js:24-47` (18 `apiRouter.use`), `src/app/app.js:73-76` root `health|readiness|metrics`
- Prisma: `prisma/schema.prisma:1-952` (52 lines enums @10-126, Tenant @128, User @201 with double unique, TenantMembership @232, Role @298, Permission @370, Category @420, Product @444, Variant @483, Image @531, Attribute @552, Warehouse @590, Inventory @616/663, Customer @682, Order @702, Payment @772, Notification @858, Audit @913)
- Auth: `src/modules/auth/auth.routes.js:48-57` (8 ops `authLimiter`), `auth.middleware.js:28-60` (401/403 codes), `jwt.util.js:21-56` (HS256 `15m|7d`), `auth.validation.js:3-51` (regex `8-128`), `src/config/env.js:32-43` (`JWT_ACCESS_EXPIRY 15m` etc)
- RBAC: `src/modules/auth/authorization.middleware.js:8-86` (`authorize` + unused `authorizePlatform`), `src/modules/roles/roles.routes.js:40-47`, `permissions.routes.js:25-30`, `users.routes.js:40-51`, `prisma/seed.js` (38 perms 3 roles)
- Realtime: `src/realtime/socket.server.js:7-106`, `socket.auth.js:1-92`, `realtime.service.js:1-162` (5 events `REALTIME_EVENTS`, `sanitizePayload`, rooms `tenant:{t} user:{u}`, envelope `event|data|tenantId|timestamp`)
- Frontend shell: `app/page.tsx:1-69` (boilerplate), `app/layout.tsx:15-18`, `package.json:11-16` (`next 16.3.5` no client libs), `next.config.ts:3` empty, `app/*` only 3 files — **NOT STARTED**

---

**Final Auditor Status:** `AUTOMATED VERIFIED` (audit complete, evidence cited, lint/type/build applicability checked). **Final Product Status:** `NOT STARTED` for all F-phases (frontend empty) — `IMPLEMENTED` deferred until human approves this audit. Human verification remains **yours** — do not mark `APPROVED` from this report alone.
