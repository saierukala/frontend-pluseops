"use client";

import * as React from "react";
import { TenantSidebar } from "./tenant-sidebar";
import { TenantTopbar } from "./tenant-topbar";
import { MobileDrawer } from "./mobile-drawer";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function TenantShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const pathname = usePathname();

  // close drawer on route change — intentional sync on navigation
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <TenantSidebar className="sticky top-0 h-screen overflow-hidden" />
      </div>

      {/* Mobile drawer */}
      <MobileDrawer open={mobileOpen} onOpenChange={setMobileOpen}>
        <TenantSidebar className="h-full w-full border-r-0" onNavigate={() => setMobileOpen(false)} />
      </MobileDrawer>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TenantTopbar onMenuClick={() => setMobileOpen(true)} onSearch={setSearchValue} />

        {/* Mobile search bar */}
        <div className="border-b bg-background px-3 py-2 md:hidden">
          <label htmlFor="mobile-search" className="sr-only">
            Search workspace
          </label>
          <div className="flex h-9 items-center gap-2 rounded-lg border bg-card px-3 shadow-xs focus-within:ring-2 focus-within:ring-ring">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" />
            </svg>
            <input
              id="mobile-search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search products, orders…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {searchValue ? (
              <button aria-label="Clear search" onClick={() => setSearchValue("")} className="text-muted-foreground hover:text-foreground">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        <main className={cn("flex-1 min-w-0 bg-background")}>
          {/* Content container */}
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</div>
        </main>

        {/* Bottom nav for mobile — fast access to primary groups */}
        <nav aria-label="Primary mobile" className="sticky bottom-0 z-20 border-t bg-background/95 backdrop-blur lg:hidden">
          <div className="grid grid-cols-5 gap-1 px-1 py-1.5">
            {[
              { label: "Home", href: "/dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
              { label: "Catalog", href: "/products", icon: "M12 2l9 4.5v9L12 20 3 15.5v-9L12 2z" },
              { label: "Orders", href: "/orders", icon: "M3 4h18v16H3z" },
              { label: "Inventory", href: "/inventory", icon: "M3 7l9-4 9 4-9 4-9-4z" },
              { label: "More", href: "#more", icon: "M12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4M12 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4" },
            ].map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              if (item.href === "#more") {
                return (
                  <button
                    key={item.label}
                    onClick={() => setMobileOpen(true)}
                    className="flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                    {item.label}
                  </button>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href as unknown as never}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

