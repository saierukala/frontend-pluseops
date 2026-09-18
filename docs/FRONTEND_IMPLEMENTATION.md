# PulseOps Frontend Implementation

Single source for frontend progress. Checkbox `[x]` only when phase is **APPROVED** after human verification. Master roadmap remains `docs/PULSEOPS_FRONTEND_MASTER_ROADMAP.md` (do not modify).

---

## Checklist — All Roadmap Phases

### Foundation

- [x] F01 — Project Foundation — APPROVED
- [x] F02 — Design System — APPROVED
- [ ] F03 — Application Shell — NOT STARTED
- [ ] F04 — API Client & Data Layer — NOT STARTED
- [ ] F05 — Authentication — NOT STARTED
- [ ] F06 — Session & Security — NOT STARTED
- [ ] F07 — RBAC & Permission System — NOT STARTED
- [ ] F08 — Tenant Context — NOT STARTED

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

- Status: APPROVED
- Scope: Reusable UI primitives (43 components: Button…ProductGrid), showcase at `/design-system`
- Tokens: `app/globals.css` + `src/config/tokens.ts`
- Architecture: `components/ui` (canonical), `components/forms`, `components/tables`, `components/feedback`, `components/charts`, `components/display`
- Automated verification: PASS (`lint`/`typecheck`/`build` — 0 errors; responsive overflow fixed; hydration fixed)
- Live verification: PASS (Chromium 153 at 375/768/1024/1280 light+dark, keyboard/overlay/toast/pagination/command menu)
- Human verification: PASS
- Evidence: `docs/evidence/f02-*.png` + `f02-verification-results.json` (74 checks)
- Docs: `docs/DESIGN_SYSTEM.md`

### F03 — Application Shell

- Status: NOT STARTED
- Scope: Root, tenant, platform and storefront layouts; navigation groups; Topbar/Sidebar
- Backend dependency: None currently required (tenant identity via `GET /auth/me`)
- Human verification: Pending

### F04 — API Client & Data Layer

- Status: NOT STARTED
- Scope: Single HTTP abstraction (auth headers, request IDs, error normalization, 401 refresh+retry, 429, pagination, query serialization)
- Backend dependency: 115 operations / 81 paths (OpenAPI 3.0.3) — no inventing endpoints
- Human verification: Pending

### F05 — Authentication

- Status: NOT STARTED
- Scope: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, protected routes
- Backend dependency: `POST /auth/*` + `GET /auth/me` — SUPPORTED
- Human verification: Pending

### F06 — Session & Security

- Status: NOT STARTED
- Scope: Access 15m / refresh 7d lifecycle, deduplication, 401→refresh→retry once
- Backend dependency: JWT HS256 — SUPPORTED
- Human verification: Pending

### F07 — RBAC & Permission System

- Status: NOT STARTED
- Scope: PermissionContext/Guard, `Can()`, RoleGuard, 403 polish
- Backend dependency: `GET /users/me/permissions` via `authorize` — SUPPORTED
- Human verification: Pending

### F08 — Tenant Context

- Status: NOT STARTED
- Scope: Tenant from auth; no discovery/switch until backend exists
- Backend dependency: **BACKEND DEPENDENCY** — `GET /tenants` list / `POST /switch-tenant` NOT AVAILABLE
- Human verification: Pending

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

- Status: NOT STARTED
- Scope: Platform dashboard, tenants, subscriptions, users, audit, system
- Backend dependency: **BACKEND DEPENDENCY** — platform RBAC not mounted (no `/platform/*` routes)
- Human verification: Pending

### F32 — Tenant Management

- Status: NOT STARTED
- Scope: Tenant table/actions (open/edit/suspend/reactivate/delete)
- Backend dependency: **PARTIALLY SUPPORTED** — `POST|GET|PATCH|DELETE /tenants/:id` exists; `GET /tenants` list NOT AVAILABLE
- Human verification: Pending

### F33 — Tenant Workspace Experience

- Status: NOT STARTED
- Scope: Platform → tenant workspace entry
- Backend dependency: **BACKEND DEPENDENCY** — impersonation NOT AVAILABLE
- Human verification: Pending

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
- **F03 is NEXT.** Do not implement until human approves current state.

