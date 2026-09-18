import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";

export default function ShellShowcasePage() {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container-pulse flex h-14 items-center justify-between">
          <Link href={"/" as unknown as never} className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 12h6l2-6 4 12 2-6h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-sm font-semibold">PulseOps</span>
            <Badge variant="secondary">F03</Badge>
          </Link>
          <div className="flex items-center gap-2">
            <Link href={"/dashboard" as unknown as never} className="hidden sm:inline-flex h-9 items-center rounded-lg border bg-card px-3 text-sm font-medium hover:bg-accent">Tenant</Link>
            <Link href={"/platform" as unknown as never} className="hidden sm:inline-flex h-9 items-center rounded-lg border bg-card px-3 text-sm font-medium hover:bg-accent">Platform</Link>
            <Link href={"/store" as unknown as never} className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">Store</Link>
          </div>
        </div>
      </header>

      <main className="container-pulse py-8">
        <div className="mx-auto max-w-5xl">
          <Badge variant="info" className="mb-3">F03 — Application Shell</Badge>
          <h1 className="text-3xl font-bold tracking-tight">Application shells — layout & navigation structure</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            F03 establishes the reusable shells for the three product surfaces. No business logic, no API calls. Verify responsive behavior, active states, mobile drawer, topbar, keyboard focus, and distinct storefront identity.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Dashboard</CardTitle>
                <CardDescription>Sidebar + topbar • 9 navigation groups • workspace identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
                  <div className="font-medium text-foreground">Groups</div>Overview · Catalog · Inventory · Orders · Customers · Payments · Analytics · Administration · Settings
                </div>
                <Link href={"/dashboard" as unknown as never} className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-[var(--primary-hover)]">Open /dashboard →</Link>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <Link href={"/products" as unknown as never} className="rounded-full border bg-card px-2.5 py-1 hover:bg-accent">/products</Link>
                  <Link href={"/orders" as unknown as never} className="rounded-full border bg-card px-2.5 py-1 hover:bg-accent">/orders</Link>
                  <Link href={"/inventory" as unknown as never} className="rounded-full border bg-card px-2.5 py-1 hover:bg-accent">/inventory</Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900 text-slate-100 dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-white">Platform Admin</CardTitle>
                <CardDescription className="text-slate-400">Dark shell • separate from tenant • UI only</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">
                  Routes: /platform · /platform/tenants · /platform/subscriptions · /platform/users · /platform/audit · /platform/system
                </div>
                <Link href={"/platform" as unknown as never} className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-white px-3 text-sm font-medium text-slate-900">Open /platform →</Link>
                <p className="text-xs leading-5 text-slate-400">Backend dependency — no platform REST routes exposed.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storefront</CardTitle>
                <CardDescription>Commerce-light • header + footer • distinct from dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
                  Header: logo · search · cart · account. Footer with shop/account/pulseops columns.
                </div>
                <Link href={"/store" as unknown as never} className="inline-flex h-9 w-full items-center justify-center rounded-lg border bg-card px-3 text-sm font-medium hover:bg-accent">Open /store →</Link>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <Link href={"/store/products" as unknown as never} className="rounded-full border bg-card px-2.5 py-1 hover:bg-accent">/store/products</Link>
                  <Link href={"/cart" as unknown as never} className="rounded-full bg-primary px-2.5 py-1 text-primary-foreground">/cart</Link>
                  <Link href={"/account" as unknown as never} className="rounded-full border bg-card px-2.5 py-1 hover:bg-accent">/account</Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert variant="info" title="How to verify F03" className="mt-6">
            Test 375px / 768px / 1024px / 1280px · light & dark (system) · Tab through topbar/sidebar/drawer · Esc closes drawer & menus · No horizontal overflow · No console/network errors · Active nav highlights correct group.
          </Alert>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Responsive checks</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Desktop (≥1024): sidebar 272px + topbar 56px + content max 1600px.</li>
                  <li>Tablet (768): sidebar drawer, topbar stays, content padded.</li>
                  <li>Mobile (375): hamburger → drawer (overlay), bottom nav for tenant, header + category strip for storefront.</li>
                  <li>Storefront: max 1280px, light commerce header, utility bar on desktop.</li>
                  <li>All shells: no horizontal scroll, correct focus rings, semantic nav.</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Backend dependencies</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Tenant switching / discovery — UI shows static workspace, no API.</li>
                  <li>Customers — marked &quot;Soon&quot; where CRUD not available.</li>
                  <li>Platform — all routes UI-only (no GET /platform/*).</li>
                  <li>Storefront cart/checkout/account — UI-only until F26+.</li>
                  <li>Notifications/search/user-menu — UI state only in F03.</li>
                </ul>
                <p className="mt-3 text-xs">If a control needs unavailable backend, it is visibly UI-only and not faking a request.</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 rounded-xl border bg-card p-4">
            <div className="text-sm font-semibold">Quick navigation</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              {[
                ["/dashboard","Tenant dashboard"],
                ["/products","Catalog — Products"],
                ["/inventory","Inventory — Stock"],
                ["/orders","Orders"],
                ["/customers","Customers (dependency)"],
                ["/analytics","Analytics"],
                ["/admin/users","Admin — Users"],
                ["/settings","Settings"],
                ["/platform","Platform overview"],
                ["/platform/tenants","Platform — Tenants"],
                ["/store","Store home"],
                ["/cart","Cart"],
              ].map(([href,label]) => (
                <Link key={href} href={href as unknown as never} className="rounded-lg border bg-background px-3 py-2 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="font-mono text-xs">{href}</span>
                  <span className="block text-muted-foreground">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Link href={"/" as unknown as never} className="rounded-full border bg-card px-3 py-1.5 hover:bg-accent">← Home (F01)</Link>
            <Link href={"/design-system" as unknown as never} className="rounded-full border bg-card px-3 py-1.5 hover:bg-accent">Design system (F02)</Link>
            <span className="rounded-full bg-muted px-3 py-1.5">Build: npm run lint / typecheck / build</span>
          </div>
        </div>
      </main>
    </div>
  );
}

