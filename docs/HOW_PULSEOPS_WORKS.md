# How PulseOps works

A start-to-finish guide to the project: what it is, who uses it, how each flow works, and what has been
checked end to end with Playwright.

---

## 1. What PulseOps is

- **A multi-business commerce platform.** One installation serves many businesses ("tenants"). Each business
  gets a walled-off workspace: its own products, stock, customers, orders, payments, team and online shop.
- **Two repositories.**
  - `Backend-PluseOps`: Node 26 + Express 5 REST API (`/api/v1`), PostgreSQL via Prisma, Redis, BullMQ
    background jobs, Socket.IO live updates, OpenAPI docs at `/api-docs`.
  - `Frontend-PluseOps`: Next.js 16 (App Router) + shadcn/ui, TanStack Query, react-hook-form + zod.
- **Money.** Everything defaults to Indian rupees (₹, `INR`, en-IN formatting). GST is added to every order at
  18% unless a workspace sets its own rate.

## 2. The three kinds of people

| Who | Where they work | What they can do |
| --- | --- | --- |
| **Platform team** (platform admins) | `/platform` console | Create and suspend businesses, manage plans and limits, see system health, read the platform audit log, open read-only support sessions into a business |
| **Business staff** (tenant users) | `/dashboard` and the rest of the workspace | Run the business: catalog, stock, orders, payments, customers, reports, team and roles. What each person sees depends on their role |
| **Shoppers** (a business's customers) | `/shop/<store>` (or the shop's own domain) | Sign up, browse, keep a cart, check out, pay online, see their orders |

## 3. Signing in

1. Everyone (platform team and business staff) uses the **same sign-in page**, `/login`. There are no tabs.
2. The API recognises the account from the email and password:
   - a business user is signed in to their workspace and lands on **`/dashboard`**;
   - a platform admin is signed in to the console and lands on **`/platform`**.
   (Technically: the app first tries a normal sign-in; the API answers "use platform login" only after the
   password is verified, and the app then signs in with platform scope. A wrong password always gets the same
   "Invalid credentials", so nobody can tell which emails are platform accounts.)
3. Sessions use a short-lived **access token** (JWT, HS256 or RS256) plus a **refresh token**, which can be kept
   in an httpOnly cookie (`NEXT_PUBLIC_REFRESH_TOKEN_TRANSPORT=cookie`). Refreshes are single-flight so parallel
   requests never trip token-reuse protection.
4. Each area checks the session type: a business user opening `/platform` sees "Platform console only", and a
   platform admin opening a workspace page sees "Business workspace only".
5. Shoppers have a **separate** account per shop (`/shop/<store>/login`), so a person can be a shopper in many
   shops with different passwords.

## 4. A business's life, step by step

### 4.1 The platform team opens the business
1. Platform admin → **Tenants → Create tenant**: business name, slug (used to sign in and in the shop
   address), status, plan, and the first admin's name, email and password.
2. The API creates the workspace, its built-in roles (**admin, manager, member**) with their permissions, and
   the first admin, all in one transaction. The audit log records it.
3. **Plans** set limits (users, products, warehouses, orders per month). A business that hits a limit gets a
   clear "plan limit reached" error until it moves to a bigger plan.

### 4.2 The business sets up
1. The owner signs in on `/login` and lands in their workspace.
2. **Settings → Workspace**: name, currency (INR), time zone, locale, contact details and **GST rate** (blank =
   the platform default of 18%).
3. **Settings → Store & payments**: connect their own **Razorpay** account (keys are checked with Razorpay and
   stored encrypted), and optionally add a **custom domain** verified by a DNS TXT record.
4. **Warehouses**: where stock lives (one is the default).
5. **Categories** and **Attributes** (like size or colour) organise the catalog.
6. **Products** have one or more **variants (SKUs)**; each variant has its own price and stock. Products and
   variants can be draft, active or inactive; only active ones can be sold. Product images upload to local
   storage or S3.
7. **Stock**: "Adjust stock" receives goods or writes them off; "Transfer" moves units between warehouses.
   Every change is a **stock movement** with before/after levels. Low-stock items have their own page and
   trigger a notification.
8. **Team**: see who has access, change a member's status and give them more roles. New staff accounts are
   created by the platform team (tenant page → **Add an admin**); there is no "invite a colleague" button inside
   the workspace yet. **Roles**: built-in roles are fixed; custom roles pick exactly which permissions they get
   (for example `order:create`, `inventory:update`). Roles add up.

### 4.3 Selling: a staff order
1. **Orders → Create order**: pick a customer, their billing/shipping address, and items (variant, warehouse,
   quantity), plus shipping.
2. The API prices every line from the catalog at that moment (a snapshot), adds **GST per line**
   (`(price × qty − discount) × rate`, rounded to the paisa), adds shipping, and stores the rate it used on the
   order.
3. The ordered units leave stock immediately (a movement records it), so two orders can't sell the same unit.
4. **Payments**: record or confirm a payment: manual/offline (cash, bank transfer), card (Stripe) or PayPal
   from the order page, or Razorpay when the shopper pays online. Refunds can be full or partial; net revenue =
   collected − refunded.
5. **Order status** moves Pending → Confirmed → Processing → Shipped → Delivered. Cancelling puts the stock
   back. Each change is on the order's timeline and in the audit log.

### 4.4 Selling: the online shop
1. Every active business has a shop at `/shop/<slug>` (also `<slug>.<STOREFRONT_BASE_DOMAIN>` or a verified
   custom domain). `/store` finds a shop by name.
2. A shopper browses categories and products and sees prices in ₹.
3. They sign up with their email; a code/link lets them choose a password. (In development the link is shown on
   screen as "Continue (development mode)".)
4. The cart lives on the server, so it follows them across devices. Cart and checkout show **Subtotal, GST and
   the estimated total**.
5. At checkout they add a delivery address and place the order. If the shop connected Razorpay, the Razorpay
   checkout opens and the payment is confirmed by Razorpay's signed webhook; otherwise the shop settles payment
   by hand.
6. The order appears in the shopper's account and in the business's **Orders** list, and staff get a
   notification.

### 4.5 Keeping track
- **Dashboard**: collected revenue, orders waiting, catalog size, low stock, recent orders and payments.
- **Analytics**: sales trend, average order, net revenue, orders by status, top customers (7 days to 12 months).
- **Reports**: CSV exports (orders, inventory, customers…) built in the background, plus scheduled reports
  emailed to team members. Files are deleted after `REPORT_RETENTION_DAYS`.
- **Notifications**: in-app bell plus email/SMS/push preferences; message wording is editable under
  **Message templates**.
- **Audit log** (every create/update/delete with who, when and from where) and **Activity** (sign-ins and user
  actions).
- **Live updates**: Socket.IO pushes `order.created`, `order.updated`, `payment.completed`,
  `inventory.low_stock` and `notification.created`, so open screens refresh themselves.

## 5. Behind the scenes

- **Isolation.** Every query is scoped by `tenantId` taken from the token, never from the request, so one
  business can never read another's data; cross-business IDs simply return "not found".
- **Permissions.** Each route declares a permission (`authorize('order:create')`); the frontend hides what you
  can't do, but the API is the real check.
- **Background jobs** (BullMQ on Redis; run `node src/worker.js`): email, notifications, reports, analytics,
  webhooks and nightly cleanup.
- **Caching.** Analytics and dashboards are cached in Redis and cleared when orders or payments change.
- **Database.** PostgreSQL with 51 Prisma models and versioned migrations (`prisma migrate deploy`).
- **Health.** `/health`, `/health/db`, `/health/redis`, `/metrics`; the platform's System health page shows them.

## 6. Look and feel

- shadcn/ui throughout, with a collapsible sidebar, command palette (Ctrl K), breadcrumbs and a notification
  bell.
- **Settings → Appearance** (or the user menu → Appearance…):
  - **Mode**: Light, Dark or System.
  - **Sidebar color**: Pulse (default, follows light/dark), Khaki, Teal, Snow, Slate, Midnight, Dusk, Navy, Mist.
  - **Accent color**: Indigo (default), Blue, Violet, Teal, Emerald, Orange, Rose, Graphite. It recolours
    buttons, links, focus rings, highlights and the main chart colour.
  - Saved in this browser and applied before the page paints, so there is no flash of the default colours.

## 7. Running it locally

```bash
# backend (Postgres + Redis running)
npx prisma migrate deploy
npm run db:seed          # platform admin + permissions
npm start                # API on :3000
npm run db:seed:demo     # "Acme Retail" demo shop (needs the API running)
node src/worker.js       # background jobs

# frontend
npm run dev -- -p 3001   # start from PowerShell on Windows
npm run e2e              # Playwright, against :3001 and :3000
```

The demo shop's admin and the development platform admin are defined in the backend's `scripts/seed-demo.js`
and `prisma/platform-admin-credentials.js`.

## 8. What Playwright checked (25 Oct 2026)

All **12 tests passed** (1.5 min) against the local API and web app. The walkthrough
(`e2e/walkthrough.spec.ts`) creates a brand-new business each run and follows it through every step below.

**One sign-in for everyone** (`e2e/login.spec.ts`)
- [x] The sign-in page has no tenant/platform tabs
- [x] A business user lands in their workspace (`/dashboard`)
- [x] A platform administrator lands in the platform console (`/platform`)
- [x] A wrong password is refused without revealing the account type

**1 · The public site**
- [x] The landing page explains the product and offers sign-in
- [x] The store finder opens a shop by its name (prices shown in INR)

**2 · The platform team opens a new business**
- [x] Platform admin signs in on the shared sign-in page and lands in the console
- [x] System health reports API, database, Redis and jobs as operational
- [x] The plans page lists the subscription plans
- [x] Creates a business with its first admin
- [x] The new business appears in the tenant list and opens
- [x] The platform audit log records the new tenant
- [x] Platform admin logs out

**3 · The business sets up and sells**
- [x] The new owner signs in on the same page and lands in their own workspace
- [x] Adds a warehouse
- [x] Adds a category
- [x] Adds a product priced in rupees (₹1,000)
- [x] Adds a sellable variant (SKU)
- [x] Receives 50 units into the warehouse
- [x] Adds a customer
- [x] Creates an order for 2 units: subtotal ₹2,000 + GST (18%) ₹360 = total ₹2,360
- [x] Placing the order takes the 2 units out of stock (48 left) and logs a stock movement
- [x] Records the payment for the order
- [x] Moves the order Confirmed → Processing → Shipped → Delivered
- [x] The payments page lists the completed ₹2,360 payment
- [x] The dashboard and revenue analytics count the sale
- [x] Requests a CSV export of orders
- [x] Creates a custom role
- [x] The audit log records who did what
- [x] A business owner can't open the platform console
- [x] The owner logs out

**4 · A shopper buys from the new shop**
- [x] Signs up in the shop and sets a password
- [x] Finds the product in the catalog (₹1,000.00) and adds it to the cart
- [x] The cart shows subtotal, GST (18%) ₹180 and total ₹1,180
- [x] Checks out with a delivery address; the placed order shows GST ₹180
- [x] The order shows in the shopper's account

**5 · The business sees the shop order, and sign-in stays safe**
- [x] The shop order arrives in the business's order list
- [x] A notification tells staff about new orders
- [x] After logging out, workspace pages ask to sign in again
- [x] A wrong password is refused

**Focused checks**
- [x] Staff order on the demo shop: GST is exactly 18% of the subtotal, in ₹ (`e2e/staff-order.spec.ts`)
- [x] A new shopper on the demo shop signs up and checks out with GST in ₹ (`e2e/storefront.spec.ts`)
- [x] Appearance: a sidebar palette, accent colour and dark mode apply at once, survive a reload, and reset
      from the user-menu dialog (`e2e/appearance.spec.ts`)

**Visual review.** Every page (55 screens: public, sign-in, all workspace pages, platform console, shop, plus
phone width) was screenshotted in two looks: light with the defaults, and dark with the Midnight sidebar and
Emerald accent. This review found and fixed the issues below.

### Problems found while testing, now fixed
- Revenue page showed **NaN** for Refunded and Net: the API's daily rows lacked refund and net amounts
  (backend fix and test).
- Analytics **Orders by status** chart was empty: the page asked for the daily view instead of the status
  breakdown.
- **Adding a top-level category failed silently** (the page sent `parentId: null`, which the API rejects on
  create).
- **Adding a variant without a barcode or cost failed silently** (same `null` problem). The API now also lets
  you clear them when editing (backend fix and test).
- The shared **Alert** layout put the title in the wrong column on every page that used it.
- Developer wording removed from Roles, the 403 page, the platform Tenants and tenant detail pages, and the
  workspace-mismatch page; the platform Tenants list was rebuilt to match the other pages.
- Full record IDs in notifications and the activity log are now short `#379F2C31` references; stock-movement
  reasons read "Order created" instead of `ORDER_CREATED`.
- The order list fits on a phone (the order number moves under the customer name).
- The old developer home page and the `/shell` and `/design-system` showcase pages were replaced by a product
  landing page.

### Known gaps (not bugs, not built yet)
- Staff can't invite colleagues from inside a workspace; the platform team creates their accounts.
- Live deployment (hosting, domains, real Razorpay/SMTP keys) is not done; see `PRODUCTION_CHECKLIST.md`.
