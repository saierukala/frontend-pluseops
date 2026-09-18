# PULSEOPS — NEXT.JS FRONTEND MASTER ROADMAP

## Document Status

**Status:** MASTER FRONTEND ROADMAP
**Backend Source:** `PULSEOPS_FRONTEND_BACKEND_HANDOFF.md`
**Frontend Framework:** Next.js + React + TypeScript
**Routing:** Next.js App Router
**Backend API:** PulseOps REST API
**Realtime:** Socket.IO
**Database:** PostgreSQL — accessed only through backend APIs
**State/Data:** Server/API state + carefully scoped client state
**Primary UI Goal:** Production-quality SaaS dashboard + customer storefront

---

# 00 — FRONTEND MISSION

The PulseOps frontend is not just an admin panel.

It is a complete product interface consisting of three connected experiences:

```text
                         PULSEOPS
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
      PLATFORM ADMIN   TENANT ADMIN    CUSTOMER
             │              │              │
             │              │              │
       Manage tenants   Manage business   Browse
       Subscriptions    Products          Products
       Tenant status    Inventory         Cart
       Platform data    Orders            Checkout
       Platform audit   Payments          Orders
       System health    Customers         Tracking
                        Users/RBAC        Account
                        Analytics
```

The frontend must feel like one coherent product while giving each user type the correct experience.

---

# 01 — NON-NEGOTIABLE FRONTEND PRINCIPLES

## 1.1 Backend is the contract

Never invent an API endpoint.

The current backend handoff verified:

* 115 API operations
* 81 path keys
* 19 public operations
* 96 protected operations
* OpenAPI 3.0.3
* JWT Bearer authentication
* tenant isolation
* RBAC
* pagination
* filtering
* sorting
* realtime events

The OpenAPI/backend implementation is the source of truth.

---

## 1.2 Do not fake unavailable functionality

When backend functionality does not exist:

```text
BACKEND DEPENDENCY
```

must be recorded.

Examples:

```text
Tenant discovery       → BACKEND DEPENDENCY
Tenant switching       → BACKEND DEPENDENCY
Customer CRUD          → BACKEND DEPENDENCY
Platform admin APIs    → BACKEND DEPENDENCY
Password change        → BACKEND DEPENDENCY
Role removal           → BACKEND DEPENDENCY
```

The UI can be designed, but must not pretend these APIs exist.

---

## 1.3 UI quality is a first-class requirement

The application must not look like a collection of CRUD screens.

Every major page must have:

* clear hierarchy
* useful whitespace
* consistent spacing
* meaningful typography
* polished cards
* responsive tables
* useful empty states
* skeleton loading
* contextual actions
* confirmation dialogs
* clear success/error feedback
* accessible controls
* mobile/tablet/desktop layouts

---

# 02 — PRODUCT UI DIRECTION

## Overall visual language

PulseOps should feel like a modern professional SaaS platform.

Target characteristics:

```text
Clean
Modern
Professional
Dense when necessary
Spacious where useful
Fast
Readable
Consistent
Responsive
Accessible
```

Avoid:

```text
Overloaded dashboards
Huge unnecessary cards
Excessive gradients
Random colors
Inconsistent buttons
Crowded tables
Tiny typography
CRUD-only layouts
```

---

# 03 — DESIGN SYSTEM

Create a reusable PulseOps design system before building large modules.

## Core primitives

```text
Button
IconButton
Input
Textarea
Select
Combobox
DatePicker
DateRangePicker
Checkbox
Radio
Switch
Badge
Avatar
Tooltip
Dropdown
Tabs
Card
Modal
Drawer
Dialog
Toast
Alert
Breadcrumb
Pagination
Skeleton
EmptyState
ErrorState
StatCard
DataTable
FilterBar
SearchBar
CommandMenu
```

## Layout primitives

```text
PageShell
PageHeader
Section
SectionHeader
ContentGrid
Stack
Toolbar
Sidebar
Topbar
BottomNavigation
```

## Data display

```text
MetricCard
StatusBadge
MoneyDisplay
DateDisplay
QuantityDisplay
TrendIndicator
ActivityItem
Timeline
OrderStatusStepper
ProductCard
ProductGrid
```

---

# 04 — RESPONSIVE DESIGN SYSTEM

Every screen must support:

```text
Mobile
Tablet
Laptop
Desktop
Large Desktop
```

Desktop dashboard:

```text
┌────────────┬────────────────────────────────────┐
│ Sidebar    │ Topbar                             │
│            ├────────────────────────────────────┤
│ Dashboard  │                                    │
│ Products   │ Page content                       │
│ Inventory  │                                    │
│ Orders     │                                    │
│ Analytics  │                                    │
│ Settings   │                                    │
└────────────┴────────────────────────────────────┘
```

Mobile:

```text
┌──────────────────────────┐
│ Logo       🔔     ☰      │
├──────────────────────────┤
│ Page title               │
│                          │
│ Content                  │
│                          │
│                          │
├──────────────────────────┤
│ Home Products Orders ... │
└──────────────────────────┘
```

Tables must transform intelligently on mobile instead of simply overflowing.

---

# 05 — FRONTEND ARCHITECTURE

Recommended structure:

```text
src/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── (platform)/
│   ├── (tenant)/
│   ├── (storefront)/
│   └── ...
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   ├── tables/
│   ├── charts/
│   └── feedback/
│
├── features/
│   ├── auth/
│   ├── tenants/
│   ├── products/
│   ├── inventory/
│   ├── orders/
│   ├── payments/
│   ├── customers/
│   ├── notifications/
│   ├── analytics/
│   ├── users/
│   ├── roles/
│   └── platform/
│
├── lib/
│   ├── api/
│   ├── auth/
│   ├── permissions/
│   ├── realtime/
│   ├── validation/
│   ├── formatting/
│   └── utilities/
│
├── hooks/
├── types/
└── config/
```

Use route groups/layouts to separate the three product surfaces.

Next.js supports nested layouts specifically for shared dashboard UI, while route-based splitting/prefetching helps keep navigation responsive.

---

# 06 — F01: PROJECT FOUNDATION

## Objective

Create the production frontend foundation.

## Tasks

* Initialize Next.js
* TypeScript
* App Router
* ESLint
* formatting
* environment configuration
* path aliases
* development scripts
* production build
* error boundaries
* loading boundaries
* not-found handling
* metadata foundation
* favicon/brand assets
* global CSS
* design tokens

## Acceptance

```text
npm run dev       ✓
npm run lint      ✓
npm run build     ✓
```

---

# 07 — F02: DESIGN SYSTEM

Build the complete reusable UI system.

## Deliverables

* typography
* spacing
* radius
* shadows
* surfaces
* borders
* buttons
* forms
* dialogs
* cards
* badges
* tables
* charts
* skeletons
* empty states
* alerts
* toasts

## Acceptance

No module should create its own random button/table/card styling.

---

# 08 — F03: APPLICATION SHELL

Build:

```text
Root Layout
Tenant Dashboard Layout
Platform Layout
Storefront Layout
```

## Tenant shell

```text
Logo
Workspace/Tenant identity
Navigation
Notifications
Search
User menu
Theme/preferences
```

Navigation groups:

```text
Overview
Catalog
Inventory
Orders
Customers
Payments
Analytics
Administration
Settings
```

---

# 09 — F04: API CLIENT & DATA LAYER

Create a single API abstraction.

Responsibilities:

```text
HTTP requests
Authorization headers
Request IDs
JSON parsing
Error normalization
401 handling
Refresh handling
Retry once
429 handling
Pagination
Query serialization
```

## Important

No component should directly scatter:

```text
fetch("http://localhost:3000/...")
```

throughout the application.

Instead:

```text
Component
   ↓
Feature API
   ↓
API client
   ↓
Backend
```

---

# 10 — F05: AUTHENTICATION

Pages:

```text
/login
/register
/forgot-password
/reset-password
/verify-email
```

Build:

* login
* registration
* logout
* password reset
* email verification
* session restoration
* token refresh
* protected routes
* unauthorized state
* forbidden state

---

# 11 — F06: SESSION & SECURITY

Implement:

```text
Access token lifecycle
Refresh token lifecycle
Refresh deduplication
Expired token recovery
Logout cleanup
Session restoration
Protected navigation
```

Flow:

```text
Request
 ↓
Access token
 ↓
401?
 ↓
Refresh
 ↓
Retry once
 ↓
Failure → Login
```

Never infinite-loop retries.

---

# 12 — F07: RBAC & PERMISSION SYSTEM

Create:

```text
PermissionContext
PermissionGuard
Can()
RoleGuard
ProtectedRoute
```

Example:

```text
if user has product:create
    show Create Product

else
    hide button
```

Also provide route-level protection.

403 pages must be polished rather than raw error screens.

---

# 13 — F08: TENANT CONTEXT

Current backend limitation:

```text
Tenant discovery/list → NOT AVAILABLE
Membership listing     → NOT AVAILABLE
Tenant switching       → NOT AVAILABLE
```

Therefore the first implementation must use the tenant context available through authentication.

Do not invent:

```text
GET /tenants
GET /users/me/tenants
POST /switch-tenant
```

until backend APIs exist.

---

# 14 — F09: TENANT ADMIN DASHBOARD

Route:

```text
/dashboard
```

## Top section

```text
Good morning, Admin

Tenant name
Current date
Quick actions
```

## KPI section

```text
Revenue
Orders
Products
Inventory
Customers
Payments
```

## Main content

```text
Revenue chart
Orders chart
Order status distribution
Low stock alerts
Recent orders
Recent activity
```

## UX rule

Don't make every statistic a giant card.

Use visual hierarchy:

```text
Primary KPI
    ↓
Main chart
    ↓
Operational widgets
    ↓
Recent activity
```

---

# 15 — F10: PRODUCT CATALOG

Routes:

```text
/products
/products/[id]
```

Features:

* product listing
* search
* filters
* sorting
* pagination
* product creation
* editing
* deletion
* product status
* category assignment
* variants
* images

## Product list UI

```text
Products                         + Add Product

Search products...

[Status] [Category] [Price] [Sort]

┌──────────────────────────────────────────┐
│ Image │ Product │ SKU │ Price │ Status   │
├──────────────────────────────────────────┤
│ ...                                       │
└──────────────────────────────────────────┘
```

---

# 16 — F11: PRODUCT DETAIL EXPERIENCE

Product detail should be a rich workspace.

```text
Product
├── Overview
├── Details
├── Variants
├── Attributes
├── Images
├── Inventory
└── Activity
```

Do not create separate disconnected pages when tabs/drawers are more useful.

---

# 17 — F12: CATEGORIES

Route:

```text
/admin/categories
```

Use a hierarchical tree.

```text
Electronics
 ├── Phones
 │    ├── Android
 │    └── iPhone
 └── Accessories
```

Features:

* create
* edit
* delete
* parent selection
* search

---

# 18 — F13: ATTRIBUTES

Routes:

```text
/admin/attributes
/admin/attributes/[id]/values
```

UI:

```text
Attribute
Color
Size
Material
Brand
```

Each attribute gets a clean detail/value management interface.

---

# 19 — F14: PRODUCT IMAGE MANAGEMENT

Build:

```text
Drag & Drop
Preview
Upload
Reorder
Primary image
Variant images
Delete
```

Image states:

```text
Uploading
Processing
Success
Failed
Retry
Expired URL
```

---

# 20 — F15: WAREHOUSE MANAGEMENT

Route:

```text
/admin/warehouses
```

Features:

* warehouse list
* create
* edit
* delete
* active/inactive
* default warehouse
* location information

---

# 21 — F16: INVENTORY CENTER

Routes:

```text
/inventory
/inventory/movements
/inventory/low-stock
```

Main UI:

```text
Inventory Health

Total stock
Reserved
Available
Low stock
Out of stock
```

Tables:

```text
Product
SKU
Warehouse
Quantity
Reserved
Available
Status
```

Actions:

```text
Adjust
Transfer
View history
```

---

# 22 — F17: ORDER MANAGEMENT

Routes:

```text
/orders
/orders/[id]
/orders/new
```

Order list:

```text
Order ID
Customer
Items
Total
Payment
Status
Created
Actions
```

Order detail:

```text
Order header
Customer
Items
Pricing
Payment
Status
History
```

Status visualization:

```text
PENDING
   ↓
CONFIRMED
   ↓
PROCESSING
   ↓
SHIPPED
   ↓
DELIVERED
```

Use a visual stepper.

---

# 23 — F18: PAYMENT EXPERIENCE

Route:

```text
/payments/[id]
```

Build:

* payment summary
* status
* transaction history
* confirm action
* refund dialog
* refund history
* provider information where exposed

Never allow frontend to modify the server-derived amount.

---

# 24 — F19: USER MANAGEMENT

Routes:

```text
/admin/users
/admin/users/[id]
```

Features:

* user list
* search
* filters
* user detail
* edit name/status
* delete
* role assignment

---

# 25 — F20: ROLES & PERMISSIONS

Routes:

```text
/admin/roles
/admin/roles/[id]
```

Display:

```text
Role
Description
Users
Permissions
```

Permission matrix:

```text
              Read Create Update Delete
Products       ✓     ✓      ✓      ✓
Inventory      ✓     -      ✓      -
Orders         ✓     ✓      ✓      -
Payments       ✓     ✓      ✓      ✓
```

Current backend limitation:

```text
Role permission removal → NOT AVAILABLE
User role removal       → NOT AVAILABLE
```

Do not implement fake DELETE behavior.

---

# 26 — F21: NOTIFICATIONS

Global notification center:

```text
🔔 3
```

Dropdown:

```text
New order
Payment completed
Low inventory
System notification
```

Dedicated page:

```text
/notifications
```

Preferences:

```text
/settings/notifications
```

Support:

* unread state
* mark read
* mark all read
* filters
* realtime notifications

---

# 27 — F22: REALTIME ENGINE

Create reusable Socket.IO layer.

Events:

```text
order.created
order.updated
inventory.low_stock
payment.completed
notification.created
```

Use it to update:

```text
Dashboard
Orders
Inventory
Payments
Notifications
```

Example:

```text
Backend
  ↓
inventory.low_stock
  ↓
Realtime service
  ↓
Toast
  ↓
Inventory widget updates
```

---

# 28 — F23: ANALYTICS

Routes:

```text
/analytics
/analytics/sales
/analytics/orders
/analytics/inventory
/analytics/customers
/analytics/revenue
```

UI:

```text
Date range
Group by:
  Day
  Week
  Month
```

Charts:

* revenue trend
* order trend
* inventory movement
* customer growth
* sales breakdown

Charts must communicate information, not merely decorate the page.

---

# 29 — F24: AUDIT & ACTIVITY

Routes:

```text
/admin/audit
/admin/activity
```

Audit table:

```text
Date
User
Action
Resource
Resource ID
Result
```

Detail drawer:

```text
Before
After
IP
User agent
Request ID
```

Sensitive information must remain masked according to backend behavior.

---

# 30 — F25: CUSTOMER MANAGEMENT

## Status

**BACKEND DEPENDENCY**

Backend has a Customer model but no complete Customer CRUD API.

Desired UI:

```text
/customers
/customers/[id]
```

Features planned:

* customer list
* search
* customer profile
* orders
* payments
* contact information
* customer activity

But implementation of data operations waits for backend support.

---

# 31 — F26: CUSTOMER STOREFRONT

This is one of the most important parts of the product.

The storefront should NOT look like the admin dashboard.

Separate visual identity:

```text
Storefront
├── Header
├── Search
├── Categories
├── Product discovery
├── Product detail
├── Cart
├── Checkout
├── Account
└── Orders
```

---

# 32 — CUSTOMER HOMEPAGE

Design:

```text
┌─────────────────────────────────────────┐
│ Logo   Search              Account Cart │
├─────────────────────────────────────────┤
│                                         │
│        Featured Products / Hero         │
│                                         │
├─────────────────────────────────────────┤
│ Categories                              │
├─────────────────────────────────────────┤
│ Popular Products                        │
├─────────────────────────────────────────┤
│ New Arrivals                            │
├─────────────────────────────────────────┤
│ Featured Collection                     │
└─────────────────────────────────────────┘
```

Keep it visually clean.

---

# 33 — CUSTOMER PRODUCT DISCOVERY

Routes:

```text
/store
/store/products
/store/products/[id]
```

Features:

* product grid
* search
* category navigation
* price filtering
* sorting
* product cards
* stock availability
* image gallery

Product card:

```text
┌───────────────┐
│               │
│    IMAGE      │
│               │
├───────────────┤
│ Product Name  │
│ ₹1,299        │
│ ★ Available   │
│               │
│ [Add to cart] │
└───────────────┘
```

---

# 34 — F27: CART

Route:

```text
/cart
```

Features:

* product image
* variant
* quantity
* price
* subtotal
* remove
* stock validation
* continue shopping
* checkout

Cart should remain extremely simple.

---

# 35 — F28: CHECKOUT

Route:

```text
/checkout
```

Structure:

```text
Checkout

1. Customer information
2. Delivery information
3. Order summary
4. Payment
5. Confirmation
```

Never calculate authoritative totals independently from backend.

Display backend-derived values.

---

# 36 — F29: CUSTOMER ACCOUNT

Routes:

```text
/account
/account/orders
/account/orders/[id]
/account/profile
/account/notifications
```

Account dashboard:

```text
Hello, Customer

Recent Orders
Saved Information
Notifications
Account settings
```

---

# 37 — F30: CUSTOMER ORDER TRACKING

Route:

```text
/account/orders/[id]
```

Beautiful timeline:

```text
✓ Order placed
│
✓ Confirmed
│
✓ Processing
│
● Shipped
│
○ Delivered
```

Include:

* order number
* items
* totals
* payment
* status
* order history
* realtime status updates where available

---

# 38 — F31: PLATFORM ADMIN

## Status

**BACKEND DEPENDENCY**

The current backend has platform RBAC models, but platform-admin REST routes are not currently exposed.

We therefore design the UI architecture but do not fake APIs.

Desired routes:

```text
/platform
/platform/tenants
/platform/tenants/[id]
/platform/subscriptions
/platform/users
/platform/audit
/platform/system
```

---

# 39 — PLATFORM DASHBOARD

Desired design:

```text
Platform Overview

Active Tenants
Trial Tenants
Suspended Tenants
Total Users
Orders
Revenue
System Health
```

Charts:

```text
Tenant growth
Tenant activity
Subscription distribution
Platform usage
```

---

# 40 — F32: TENANT MANAGEMENT

Desired platform workflow:

```text
Create Tenant
     ↓
Tenant Configuration
     ↓
Tenant Admin
     ↓
Subscription
     ↓
Active
```

Tenant table:

```text
Tenant
Status
Plan
Users
Created
Last Activity
Actions
```

Actions:

```text
Open
Edit
Suspend
Reactivate
Delete
```

Actual backend APIs must be added before wiring these actions.

---

# 41 — F33: TENANT WORKSPACE EXPERIENCE

The platform administrator should eventually be able to enter a tenant workspace:

```text
Platform
  ↓
Tenant
  ↓
Tenant Dashboard
```

This must be implemented only with an explicitly supported backend authorization model.

Do not simply put another tenant ID into a browser request.

---

# 42 — F34: GLOBAL UX POLISH

Review every screen for:

* spacing
* typography
* visual hierarchy
* button consistency
* icon consistency
* table density
* mobile behavior
* empty states
* loading states
* errors
* confirmation dialogs
* keyboard navigation

---

# 43 — F35: EMPTY / LOADING / ERROR STATES

Every major page needs all three.

## Loading

Use skeletons rather than blank screens.

## Empty

Example:

```text
No products yet

Add your first product to start building your catalog.

[Add Product]
```

## Error

Example:

```text
We couldn't load your products.

Request ID: ...

[Try again]
```

---

# 44 — F36: ACCESSIBILITY

Requirements:

* keyboard navigation
* visible focus
* semantic HTML
* accessible labels
* dialog focus management
* keyboard-close dialogs
* sufficient contrast
* accessible tables
* screen-reader-friendly status
* reduced-motion consideration

Accessibility is part of the feature definition, not a final optional pass.

---

# 45 — F37: PERFORMANCE

Use:

* route-level code splitting
* optimized images
* lazy loading where appropriate
* server rendering where useful
* streaming/loading boundaries where beneficial
* efficient API caching
* pagination
* debounced search
* virtualization for very large tables where needed

Next.js App Router provides route-based splitting/prefetching and loading/error conventions that fit these requirements.

---

# 46 — F38: SECURITY

Frontend security requirements:

```text
No secrets in client bundle
No API keys exposed unnecessarily
No tenant spoofing
No trusting client permissions
No payment amount manipulation
No sensitive information in logs
No unsafe HTML rendering
Safe redirects
Safe error display
```

Backend remains authoritative for:

```text
Authentication
Authorization
Tenant identity
Pricing
Inventory
Payment
Order state
```

---

# 47 — F39: E2E TESTING

Use end-to-end flows covering:

## Authentication

```text
Login
Logout
Refresh
Expired access token
Forgot password
Reset password
Email verification
```

## Tenant administration

```text
Dashboard
Products
Inventory
Orders
Payments
Users
Roles
Notifications
Analytics
Audit
```

## Customer

```text
Browse
Search
Product detail
Cart
Checkout
Order
Order tracking
```

## Security

```text
Unauthorized
Forbidden
Cross-tenant resource
Expired session
```

---

# 48 — F40: API INTEGRATION TESTING

Every API-integrated feature should verify:

```text
Correct endpoint
Correct HTTP method
Correct headers
Correct body
Correct query parameters
Correct permissions
Correct error mapping
Correct pagination
Correct tenant context
```

No frontend feature is considered complete merely because the UI renders.

---

# 49 — F41: RESPONSIVE QA

Test:

```text
Mobile
Tablet
Laptop
Desktop
Large desktop
```

Special attention:

```text
Tables
Dialogs
Sidebars
Product grids
Checkout
Charts
Navigation
Forms
```

---

# 50 — F42: PRODUCTION BUILD & DEPLOYMENT

Verify:

```text
Environment variables
API URL
Socket URL
Production build
Image handling
Caching
Error reporting
Security headers
HTTPS
```

Deployment architecture:

```text
                    Internet
                       │
                       ▼
                 Next.js Frontend
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
       REST API              Socket.IO
            │                     │
            └──────────┬──────────┘
                       ▼
                  PulseOps API
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
        PostgreSQL             Redis
                                 │
                              BullMQ
```

---

# 51 — F43: FINAL UX AUDIT

Before release, inspect every page manually.

Checklist:

```text
□ No broken layouts
□ No overflow
□ No dead buttons
□ No fake API actions
□ No missing loading states
□ No missing empty states
□ No raw backend errors
□ No unauthorized buttons
□ No inconsistent spacing
□ No inconsistent typography
□ No broken mobile UI
□ No inaccessible controls
□ No console errors
□ No hydration errors
□ No leaked secrets
□ No tenant leakage
```

---

# 52 — FINAL PRODUCT NAVIGATION

## Platform

```text
Platform Dashboard
├── Tenants
│   ├── All Tenants
│   ├── Tenant Detail
│   └── Tenant Workspace
├── Subscriptions
├── Platform Users
├── Platform Analytics
├── Platform Audit
└── System
```

## Tenant Admin

```text
Tenant Dashboard
├── Overview
├── Catalog
│   ├── Products
│   ├── Categories
│   ├── Attributes
│   └── Images
├── Inventory
│   ├── Stock
│   ├── Movements
│   └── Low Stock
├── Orders
│   ├── All Orders
│   └── Create Order
├── Customers
├── Payments
├── Notifications
├── Analytics
├── Administration
│   ├── Users
│   ├── Roles
│   ├── Audit
│   └── Activity
└── Settings
```

## Customer

```text
Store
├── Home
├── Products
├── Categories
├── Product Detail
├── Cart
├── Checkout
├── Order Confirmation
└── Account
    ├── Profile
    ├── Orders
    ├── Order Detail
    └── Notifications
```

---

# 53 — BACKEND DEPENDENCY REGISTER

These are explicitly separated from frontend implementation.

| Requirement                      | Current backend |
| -------------------------------- | --------------- |
| Tenant list/discovery            | NOT AVAILABLE   |
| Tenant switching                 | NOT AVAILABLE   |
| Tenant memberships               | NOT AVAILABLE   |
| Customer CRUD                    | NOT AVAILABLE   |
| Customer storefront auth/API     | NOT AVAILABLE   |
| Authenticated password change    | NOT AVAILABLE   |
| Remove user role                 | NOT AVAILABLE   |
| Remove role permission           | NOT AVAILABLE   |
| Notification template management | NOT AVAILABLE   |
| Full report export               | NOT AVAILABLE   |
| Some S3/presigned functionality  | GAP             |
| Platform admin API routes        | NOT AVAILABLE   |

These must become a **separate backend dependency backlog**, not invented frontend APIs.

---

# 54 — HUMAN VERIFICATION GATE

Human verification is mandatory for every major frontend phase.

Automated tests, linting, type-checking, and production builds are necessary, but they do not by themselves make a frontend phase approved.

## Required phase lifecycle

```text
NOT STARTED
    ↓
IMPLEMENTED
    ↓
AUTOMATED VERIFIED
    ↓
HUMAN VERIFICATION
    ↓
APPROVED
    ↓
NEXT PHASE
```

## Important rule

```text
IMPLEMENTED ≠ APPROVED
```

Nemotron may implement the phase and provide its completion report, but must not treat the phase as human-verified or approved.

## Phase completion report

At the end of each major phase, produce a report containing:

* phase objective
* files changed
* features implemented
* backend endpoints used
* API contracts used
* tests executed
* test results
* lint/type-check/build results
* known limitations
* backend dependencies
* screenshots or evidence where useful
* items requiring human verification

## Human verification responsibilities

Human verification must test the actual running frontend against the real PulseOps backend where the required backend APIs exist.

Verify, as applicable:

* UI behavior
* navigation
* authentication and logout
* token refresh and expired-session handling
* role and permission behavior
* tenant isolation
* forms and validation
* loading, empty, error, and success states
* API integration
* pagination/filtering/search
* realtime behavior
* responsive layouts
* keyboard navigation
* accessibility
* security-sensitive behavior
* production-like behavior

Do not approve a feature merely because its automated tests pass.

## Human Verification Report

After testing, create a dedicated report for the phase:

```text
PHASE##_HUMAN_VERIFICATION_REPORT.md
```

The report must record:

```text
Phase
Date
Environment
Backend version/commit where relevant
Frontend version/commit where relevant

Verification checklist
    PASS / FAIL / BLOCKED

Manual test scenarios
    PASS / FAIL / BLOCKED

API integration checks
    PASS / FAIL / BLOCKED

Responsive checks
    PASS / FAIL / BLOCKED

Accessibility checks
    PASS / FAIL / BLOCKED

Security checks
    PASS / FAIL / BLOCKED

Known issues
Backend dependencies
Evidence

Final status:
    APPROVED
    or
    BLOCKED
```

## Blocked-state handling

If human verification cannot be completed because of a missing backend capability, environment problem, reproducible defect, or unavailable dependency, record:

```text
BLOCKED
```

Do not convert a blocked item into PASS by assumption.

A blocked phase must not be treated as approved until the blocking condition is resolved or the scope is explicitly changed and re-verified.

## Approval rule

A phase can move to the next phase only when:

```text
Implementation complete
+
Automated verification complete
+
Human verification complete
+
No unresolved release-blocking defects
+
Backend dependencies explicitly recorded
+
Human Verification Report recorded
=
APPROVED
```

This verification gate applies throughout the roadmap, not only during the final release audit.

---

# 55 — FRONTEND COMPLETION STANDARD

A phase is not complete because:

```text
page exists
```

A phase is complete only when:

```text
UI
+
API integration
+
Loading state
+
Empty state
+
Error handling
+
Permission handling
+
Responsive UI
+
Accessibility
+
Tests
+
Manual verification
```

are complete.

---

# 56 — MASTER EXECUTION ORDER

The implementation sequence is:

```text
F01 Foundation
 ↓
F02 Design System
 ↓
F03 Application Shell
 ↓
F04 API/Data Layer
 ↓
F05 Authentication
 ↓
F06 Session Security
 ↓
F07 RBAC
 ↓
F08 Tenant Context
 ↓
F09 Dashboard
 ↓
F10–F14 Catalog
 ↓
F15 Warehouses
 ↓
F16 Inventory
 ↓
F17 Orders
 ↓
F18 Payments
 ↓
F19–F20 Users/Roles
 ↓
F21 Notifications
 ↓
F22 Realtime
 ↓
F23 Analytics
 ↓
F24 Audit
 ↓
F25 Customer Management
 ↓
F26 Storefront
 ↓
F27 Cart
 ↓
F28 Checkout
 ↓
F29 Customer Account
 ↓
F30 Order Tracking
 ↓
F31–F32 Platform/Tenants
 ↓
F33 Tenant Workspace
 ↓
F34 UX Polish
 ↓
F35 Accessibility
 ↓
F36 Performance
 ↓
F37 Security
 ↓
F38 E2E
 ↓
F39 API Integration QA
 ↓
F40 Responsive QA
 ↓
F41 Production
 ↓
F42 Final UX Audit

Every F-phase:
    ↓
Automated Verification
    ↓
Human Verification
    ↓
Human Verification Report
    ↓
APPROVED
    ↓
Next Phase
```

---

# 57 — DEFINITION OF DONE

PulseOps frontend is considered release-ready only when:

```text
✓ Admin dashboard works
✓ Tenant administration works
✓ Catalog works
✓ Inventory works
✓ Orders work
✓ Payments work
✓ Notifications work
✓ Realtime works
✓ Analytics work
✓ Audit works
✓ RBAC works
✓ Authentication works
✓ Token refresh works
✓ Tenant isolation is respected
✓ Customer storefront is polished
✓ Product discovery works
✓ Cart works
✓ Checkout works
✓ Customer orders work
✓ Order tracking works
✓ Platform UI is integrated where backend APIs exist
✓ Backend dependency gaps are resolved or explicitly excluded
✓ Responsive QA passes
✓ Accessibility QA passes
✓ E2E tests pass
✓ Human verification reports are recorded for required phases
✓ No required phase remains BLOCKED
✓ Production build passes
✓ No console/runtime errors
✓ No fake endpoints
✓ No security-sensitive data exposed
```

---

# 58 — CORE PRODUCT PRINCIPLE

The most important distinction in this project is:

```text
BACKEND
"What can PulseOps actually do?"

FRONTEND
"How can we make those capabilities extremely clear,
fast, beautiful and easy to use?"
```

The frontend should therefore be **cleaner than the backend**, not merely a visual representation of API endpoints.

The admin UI should optimize for **operations and management**.

The customer UI should optimize for **discovery, confidence, checkout and order tracking**.

The platform UI should optimize for **tenant oversight and control**.

All three should still feel like the same PulseOps product.
