"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { StorefrontBrand } from "./brand";
import { storefrontNav } from "./nav-config";
import { UserMenu as AuthUserMenu } from "@/features/auth/components/user-menu";

function StorefrontHeader({ cartCount = 2, onMenuClick }: { cartCount?: number; onMenuClick?: () => void }) {
  const pathname = usePathname();
  const [q, setQ] = React.useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Top utility bar */}
      <div className="hidden border-b bg-muted/40 text-xs sm:block">
        <div className="mx-auto flex h-7 max-w-[1280px] items-center justify-between px-4 lg:px-6">
          <span className="text-muted-foreground">Free shipping over ₹999 • Easy 7-day returns</span>
          <span className="flex items-center gap-3 text-muted-foreground">
            <Link href={"/account" as unknown as never} className="hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring rounded">Help</Link>
            <span aria-hidden>·</span>
            <Link href={"/account" as unknown as never} className="hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring rounded">Track order</Link>
          </span>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 px-4 lg:px-6">
        <StorefrontBrand />

        <nav aria-label="Store navigation" className="hidden items-center gap-1 lg:flex lg:ml-6">
          {storefrontNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href as unknown as never}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Search — desktop */}
        <div className="hidden flex-1 justify-center px-6 md:flex">
          <label className="flex h-9 w-full max-w-[520px] items-center gap-2 rounded-full border bg-muted/50 px-3.5 shadow-xs focus-within:bg-background focus-within:ring-2 focus-within:ring-ring">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" />
            </svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, brands, categories" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" aria-label="Search store" />
            {q ? (
              <button aria-label="Clear" onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            ) : (
              <span className="hidden rounded-full bg-card px-2 py-1 text-xs font-medium border lg:inline-flex">⌘K</span>
            )}
          </label>
        </div>

{/* Actions */}
        <div className="ml-auto flex items-center gap-1.5">
          <button aria-label="Search" onClick={() => setMobileSearchOpen((v) => !v)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-card hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring md:hidden">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
          </button>
          <AuthUserMenu />
          <Link href={"/cart" as unknown as never} aria-label={`Cart, ${cartCount} items`} className="relative inline-flex h-9 items-center gap-2 rounded-full border bg-card px-3 text-sm font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 7h12l-1 9H7L6 7z" /><path d="M9 7V5a3 3 0 0 1 6 0v2" /></svg>
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 ? <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">{cartCount}</span> : null}
          </Link>
          <button aria-label="Open menu" onClick={onMenuClick} className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-card lg:hidden focus-visible:ring-2 focus-visible:ring-ring">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </div>

      {mobileSearchOpen ? (
        <div className="border-t bg-background px-4 py-2 md:hidden">
          <label className="flex h-9 items-center gap-2 rounded-full border bg-muted px-3">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search store…" className="flex-1 bg-transparent text-sm outline-none" aria-label="Search store mobile" />
          </label>
        </div>
      ) : null}

      {/* Mobile category strip */}
      <div className="border-t bg-background lg:hidden">
        <div className="mx-auto flex max-w-[1280px] gap-1.5 overflow-x-auto px-4 py-2 scrollbar-none">
          {storefrontNav.map((item) => (
            <Link key={item.href} href={item.href as unknown as never} className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
              {item.label}
            </Link>
          ))}
          <Link href={"/cart" as unknown as never} className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Cart ({cartCount})</Link>
        </div>
      </div>
    </header>
  );
}

function StorefrontFooter() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <StorefrontBrand />
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Customer-facing storefront — distinct from tenant dashboard. UI shell only in F03, no storefront backend yet.</p>
            <div className="mt-3 inline-flex rounded-full border bg-card px-2.5 py-1 text-xs font-medium">F03 Shell • Storefront</div>
          </div>
          <div>
            <div className="text-sm font-semibold">Shop</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href={"/store" as unknown as never} className="hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring rounded">Store home</Link></li>
              <li><Link href={"/store/products" as unknown as never} className="hover:text-foreground">Products</Link></li>
              <li><Link href={"/store/categories" as unknown as never} className="hover:text-foreground">Categories</Link></li>
              <li><Link href={"/store/products/1" as unknown as never} className="hover:text-foreground">Product detail (sample)</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Account</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href={"/account" as unknown as never} className="hover:text-foreground">Your account</Link></li>
              <li><Link href={"/account/orders" as unknown as never} className="hover:text-foreground">Orders</Link></li>
              <li><Link href={"/cart" as unknown as never} className="hover:text-foreground">Cart</Link></li>
              <li><Link href={"/checkout" as unknown as never} className="hover:text-foreground">Checkout</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">PulseOps</div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">The same product, different experience. Tenant & Platform stay dashboard-dense; storefront stays commerce-light.</p>
            <div className="mt-3 flex gap-2">
              <Link href={"/dashboard" as unknown as never} className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent">← Tenant dashboard</Link>
              <Link href={"/platform" as unknown as never} className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent">Platform</Link>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Backend dependency: Customer storefront auth/API not available.</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 PulseOps Store • F03 application shell (no F26+ functionality yet)</span>
          <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Built for responsive commerce</span>
        </div>
      </div>
    </footer>
  );
}

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StorefrontHeader onMenuClick={() => setMobileOpen((v) => !v)} />
      {/* Mobile nav drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="absolute right-0 top-0 h-full w-[320px] max-w-[86vw] bg-background shadow-xl">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <span className="text-sm font-semibold">Menu</span>
              <button aria-label="Close" onClick={() => setMobileOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-card">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <nav className="p-4" aria-label="Mobile store navigation">
              <div className="flex flex-col gap-1">
                {[
                  { label: "Store", href: "/store" },
                  { label: "Products", href: "/store/products" },
                  { label: "Categories", href: "/store/categories" },
                  { label: "Cart", href: "/cart" },
                  { label: "Checkout", href: "/checkout" },
                  { label: "Account", href: "/account" },
                  { label: "Orders", href: "/account/orders" },
                ].map((i) => (
                  <Link key={i.href} href={i.href as unknown as never} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                    {i.label}
                  </Link>
                ))}
                <div className="my-2 h-px bg-border" />
                <Link href={"/dashboard" as unknown as never} onClick={() => setMobileOpen(false)} className="rounded-lg bg-muted px-3 py-2.5 text-sm font-medium">← Tenant dashboard</Link>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">Storefront auth, cart, and checkout are UI-only — backend dependency until F26+.</p>
            </nav>
          </div>
        </div>
      ) : null}

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-6 lg:px-6 lg:py-8">{children}</div>
      </main>
      <StorefrontFooter />
    </div>
  );
}

