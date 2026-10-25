# PulseOps Frontend — API Integration & UI Rebuild Plan

Status as of 2026-10-24. Backend is feature-complete for v1 (deployment pending). This document is the
single checklist for finishing the frontend: what every screen calls, the end-to-end flows that must
work, and the UI brief the rebuild follows.

## 0. Runtime & commands

| What | Command |
|---|---|
| Node | `26.x` (pinned in `.nvmrc` + `engines` in both repos; Dockerfile `node:26-alpine`; CI `node-version: 26`) |
| Backend API | `cd Backend-PluseOps && npm start` → `http://localhost:3000/api/v1` |
| Demo data | `cd Backend-PluseOps && npm run db:seed:demo` (API must be running) → workspace **`acme`**; demo admin credentials live in `Backend-PluseOps/scripts/seed-demo.js` |
| Frontend dev | `cd Frontend-PluseOps && npm run dev` → `http://localhost:3001` (3000 is the API) |
| Frontend gates | `npm run typecheck && npm run lint && npm run build` |
| Backend gates | `npm run lint && npm test` |

## 1. Backend gaps closed for the frontend

| Gap | Fix |
|---|---|
| Orders require `customerId` but no API could create or list customers | New `customers` module: `GET/POST /customers`, `GET/PATCH/DELETE /customers/:id` (soft delete, email unique per tenant, `customer:*` permissions already seeded). Tests: `tests/integration/phase29-customers.test.js` |
| Payments page had no list endpoint (only `GET /payments/:id`) | `GET /payments?status&orderId&page&limit` with order + customer summary and refunds |
| Tenant users couldn't read their own workspace (`/tenants/:id` is platform-only since Phase 26) | `GET/PATCH /workspace` — own tenant from the token; `tenant:read` to view, `tenant:update` to rename (slug/status/plan rejected) |
| Cached responses lost every timestamp (`createdAt: {}`) on cache hits — `stripSensitive` walked `Date`/`Decimal` objects | Cache service only walks plain objects now; regression test in `phase14-redis-caching.test.js` |
| Global rate limit 100 req / 15 min starves an SPA in local dev | Local `.env` only: `RATE_LIMIT_MAX=5000`, `AUTH_RATE_LIMIT_MAX=200`. Production defaults unchanged |

Since then the backend shipped Phases 29–36 and the frontend covers them: platform console (plans, usage, admins, audit, support sessions), reports and schedules, message templates, Razorpay and custom domains, customer addresses, workspace settings, and the storefront.

### Storefront (Phase 32)
Shoppers use `/shop/<store-slug>`; `/store` resolves a custom domain (`GET /storefront/resolve`), then `NEXT_PUBLIC_DEFAULT_STORE`, then asks for the store name.

| Screen | Endpoints |
|---|---|
| Catalog home (categories, search, sort, in-stock) | `GET /storefront/:store`, `/categories`, `/products` |
| Product page | `GET /products/:productId` |
| Sign in, create account, set password, forgot password | `POST /auth/login·register·set-password·forgot-password·refresh·logout` |
| Cart | `GET /cart`, `PUT/DELETE /cart/items/:variantId` |
| Checkout (address picker + inline add) | `GET/POST /account/addresses`, `POST /checkout` |
| Account (orders, addresses, profile) | `GET /account/orders`, `/account/addresses` CRUD, `GET/PATCH /account` |
| Order page + Pay now | `GET /account/orders/:id`, `POST /account/orders/:id/pay`, `POST /account/payments/:id/verify` (Razorpay web checkout) |

Shopper sessions are stored per store (`localStorage` key `pulseops:shop:<slug>`) and never mix with staff tokens; a 401 triggers one single-flight refresh.

Still open: a Socket.IO client for live notifications (the bell polls every 60 s), the Phase 36 httpOnly refresh-cookie mode, and team invitations (no backend endpoint).

## 2. API → screen integration matrix

Legend: ✅ wired before this phase · 🔨 wired in this phase (all 🔨 rows are done and build-verified) · — not applicable

### Auth & account (tenant + platform)
| Screen | Endpoints | Status |
|---|---|---|
| Login / register / forgot / reset / verify | `POST /auth/login·register·forgot-password·reset-password·verify-email·resend-verification` | ✅ |
| Session bootstrap, refresh, logout | `GET /auth/me`, `POST /auth/refresh·logout·logout-all` | ✅ |
| Settings → Profile | `GET/PATCH /auth/me`, `POST /auth/resend-verification` | 🔨 |
| Settings → Workspace | `GET/PATCH /workspace` | 🔨 (new API) |
| Settings → Security | `POST /auth/change-password`, `GET /auth/sessions`, `DELETE /auth/sessions/:id`, `POST /auth/logout-all` | 🔨 |
| Settings → Notifications | `GET/PATCH /notification-preferences` | 🔨 |

### Tenant workspace
| Screen | Endpoints | Status |
|---|---|---|
| Dashboard | `GET /dashboard/overview`, `GET /analytics/sales?groupBy=day` | 🔨 (redesigned) |
| Products list + create/edit/delete | `GET/POST /products`, `PATCH/DELETE /products/:id`, `GET /categories` (filter + assign) | 🔨 |
| Product detail → variants | `GET/POST /products/:id/variants`, `PATCH/DELETE …/variants/:variantId` | 🔨 |
| Product detail → images | `GET/POST /products/:id/images`, `DELETE …/images/:imageId`, `GET …/signed-url` | 🔨 |
| Categories | `GET/POST /categories`, `PATCH/DELETE /categories/:id` | 🔨 |
| Attributes + values | `GET/POST /attributes`, `PATCH/DELETE /attributes/:id`, `GET/POST /attributes/:id/values`, `DELETE …/values/:valueId` | 🔨 |
| Warehouses | `GET/POST /warehouses`, `PATCH/DELETE /warehouses/:id` | 🔨 |
| Stock | `GET /inventory`, `POST /inventory/adjust`, `POST /inventory/transfer` | 🔨 |
| Movements | `GET /inventory/movements` | 🔨 |
| Low stock | `GET /inventory/low-stock?threshold` | 🔨 |
| Orders list | `GET /orders?status&customerId` | 🔨 |
| Order detail | `GET /orders/:id`, `GET /orders/:id/history`, `PATCH /orders/:id/status`, `POST /orders/:id/cancel`, `GET /payments?orderId`, `POST /payments/create·confirm`, `POST /payments/:id/refund` | 🔨 |
| Create order | `GET /customers`, `GET /products` + variants, `GET /warehouses`, `POST /orders` | 🔨 |
| Customers | `GET/POST /customers`, `PATCH/DELETE /customers/:id` | 🔨 (new API) |
| Payments | `GET /payments`, `GET /payments/:id`, `POST /payments/:id/refund` | 🔨 (new API) |
| Analytics overview / sales / revenue | `GET /analytics/overview·sales·revenue·orders·inventory·customers` | 🔨 |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `POST /notifications/read-all` + socket | 🔨 |
| Admin → Users | `GET /users`, `PATCH/DELETE /users/:id`, `GET/POST /users/:id/roles`, `DELETE /users/:id/roles/:roleId`, `GET /roles` | 🔨 |
| Admin → Roles | `GET/POST /roles`, `PATCH/DELETE /roles/:id`, `PUT /roles/:id/permissions`, `GET /permissions` | ✅ (reskinned) |
| Admin → Audit | `GET /audit-logs` | 🔨 |
| Admin → Activity | `GET /activity-logs` | 🔨 |

### Platform console
| Screen | Endpoints | Status |
|---|---|---|
| Overview, Tenants, Tenant detail | `GET/POST /platform/tenants`, `GET/PATCH /platform/tenants/:id`, `PATCH …/status`, `POST …/admin` | ✅ (reskinned) |
| System health | `GET /health`, `/health/db`, `/health/redis`, `/health/bullmq` (`/jobs/status` is tenant-only) | 🔨 |
| Subscriptions, platform users, platform audit | no backend endpoints yet | stays "coming soon" |

### Not consumed by the UI (by design)
`POST /payments/webhook` (provider → server), `GET /storage/signed` (consumed via signed URLs), `/metrics`, `/ready`,
`POST /jobs/*` (ops only), legacy public `/tenants/*` (platform console replaces it).

## 3. End-to-end working flows (acceptance)

1. **Sign in** to workspace `acme` → dashboard shows live KPIs, sales trend, recent orders, low-stock count.
2. **Catalog**: create category → create product in it → add variant (SKU, price) → upload image → product shows in list with filter by category/status.
3. **Stock**: create warehouse → adjust stock for a variant (+N) → transfer between warehouses → both appear in Movements; low-stock list reflects threshold.
4. **Customer**: create customer → appears in Customers and in the order customer picker.
5. **Order to cash**: create order (customer, variant, warehouse, qty) → order PENDING with stock reserved → take payment (create + confirm) → advance CONFIRMED → PROCESSING → SHIPPED → DELIVERED → refund (partial) shows on Payments.
6. **Cancel**: cancel a pending order → status CANCELLED, ORDER_RELEASE movement appears.
7. **Team**: change a user's roles → audit log records it; RBAC hides actions the user can't perform.
8. **Account**: edit profile, change password, revoke another session, toggle notification channels.
9. **Platform**: platform admin creates a tenant with admin → tenant admin can sign in.

## 4. UI brief — the "command to myself"

> Rebuild the PulseOps frontend as a premium, Linear/Vercel-grade B2B SaaS using **shadcn/ui as the only
> component system**. Use the official shadcn **Sidebar** block (`SidebarProvider`, `Sidebar collapsible="icon"`,
> `SidebarInset`, `SidebarTrigger`, `SidebarRail`) for tenant and platform shells: workspace switcher header,
> grouped nav with collapsible sections, active state from `usePathname`, permission-filtered items, user menu
> footer, ⌘B to collapse, mobile sheet. Top bar: breadcrumb, ⌘K command palette (navigation + quick actions),
> theme toggle (light/dark/system), notification bell with unread count.
>
> Every page follows one anatomy: `PageHeader` (title, description, primary action) → optional KPI row → a
> `Card`-wrapped `DataTable` (search, faceted filters, server pagination, row actions in a dropdown) or detail
> layout with tabs. Forms are `Dialog`/`Sheet` + react-hook-form + zod, with inline errors mapped from API
> `VALIDATION_ERROR.details`. Loading = `Skeleton` shaped like the content; empty = icon + one-line explanation +
> primary action; errors = inline `Alert` with retry. Destructive actions confirm via `AlertDialog`. Toasts via
> sonner for every mutation.
>
> Visual language: neutral zinc surfaces, one indigo brand accent, 1px borders over shadows, `rounded-xl` cards,
> Geist Sans/Mono, tabular numbers for money and counts, status shown as soft tinted badges with a dot, charts
> via shadcn `chart` (Recharts) using `--chart-1…5`. Dark mode is first-class (class strategy, no flash).
> Density: 14px base, 36px controls, 56px top bar. Fully responsive to 375px; no horizontal page scroll; tables
> scroll inside their card. Keyboard: visible focus rings, Esc closes overlays, every icon button has a label.
>
> Rules: all data via `@/lib/api` modules (never raw fetch); money is formatted from server decimal strings,
> never computed client-side; respect RBAC via `Can`/`usePermission` for every action; add new shadcn
> components with the CLI without overwriting the customised `button`, `badge`, `card`, `input` primitives.

### Execution order (done)
1. ✅ shadcn `sidebar chart collapsible scroll-area progress toggle-group` added without overwriting customised primitives; `next-themes`, `recharts`, `@tanstack/react-query` installed.
2. ✅ Theme tokens (zinc + indigo, oklch, sidebar + chart + success/warning/info tokens, `.dark` class) and `AppProviders` (theme, query client, tooltips).
3. ✅ `AppSidebar` (collapsible icon rail, permission-filtered groups, workspace header, user menu with theme switch) + `SiteHeader` (breadcrumbs, Ctrl/⌘K palette, notification bell, theme toggle) → `TenantShell`, `PlatformShell`.
4. ✅ Building blocks in `src/components/app`: `PageHeader`, `DataTable` (+ toolbar, debounced search, filters, pager), `StatusPill`, `KpiCard`, `ConfirmDialog`, `FormDialog`/`Field`, `RowActions`, `ComboboxField`, empty/error states; `useUrlState` keeps list state in the URL.
5. ✅ Every tenant page in section 2 plus platform System health.
6. ✅ Gates: `tsc --noEmit`, `eslint` (0 errors), `next build` (53 routes); browser walk-through of flows 1, 2 (list/detail), 3 (stock views), 4 and 5 (create order → record payment → confirm) against `acme`.

### Dev server note (Windows)
Start `next dev` from PowerShell or cmd. Started from Git Bash, every route inside a `(group)` folder returns 404.
