"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { tenantNavGroups } from "./nav-config";
import { NavIcon } from "./nav-icon";
import { PulseOpsBrand } from "./brand";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" && pathname === "/dashboard") return true;
  if (href === "/dashboard") return pathname === "/dashboard";
  // exact or prefix for nested
  if (pathname === href) return true;
  if (pathname.startsWith(href + "/")) return true;
  return false;
}

export function TenantSidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const initials = user ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "WS" : "WS";
  const tenantSlugHint = user ? user.tenantId.slice(0, 8) : "—";

  return (
    <aside className={cn("flex w-[272px] shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground", className)}>
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <PulseOpsBrand />
        <span className="ml-auto hidden items-center gap-1.5 rounded-full border bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground lg:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          Live
        </span>
      </div>

      {/* Workspace identity — backend-derived */}
      <div className="border-b px-3 py-3">
        <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 shadow-xs">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold">{initials}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold leading-none">{user ? `${user.firstName} ${user.lastName}` : "Workspace"}</div>
            <div className="truncate text-xs text-muted-foreground">{user ? user.email : "Tenant workspace"}</div>
            {user && <div className="truncate text-[11px] text-muted-foreground">Tenant {tenantSlugHint}… • Tenant Admin</div>}
          </div>
          <Badge variant="outline" className="shrink-0 text-[10px]">Tenant</Badge>
        </div>
        <p className="mt-2 px-1 text-[11px] leading-4 text-muted-foreground">Tenant context is authoritative from JWT/session — not client-selected.</p>
      </div>

      {/* Nav */}
      <nav aria-label="Tenant navigation" className="flex-1 overflow-y-auto px-2 py-3">
        <div className="flex flex-col gap-5">
          {tenantNavGroups.map((group) => (
            <div key={group.label}>
              <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</div>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href as unknown as never}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active ? "bg-primary text-primary-foreground shadow-xs" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                        )}
                      >
                        <NavIcon name={item.icon} className={cn(active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                        <span className="flex-1 truncate font-medium">{item.label}</span>
                        {item.badge ? (
                          <Badge variant={active ? "secondary" : "outline"} size="sm" className={cn("ml-auto text-[10px]", active && "bg-white/20 text-white border-white/20")}>
                            {item.badge}
                          </Badge>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t p-3">
        <div className="rounded-xl border bg-muted/40 p-3">
          <div className="text-xs font-semibold">Need help?</div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Docs and support are available from the shell. No backend calls here.</p>
          <Link href={"/design-system" as unknown as never} onClick={onNavigate} className="mt-2 inline-flex text-xs font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring rounded">
            View design system →
          </Link>
        </div>
        <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
          <span>© 2026 PulseOps</span>
          <span className="rounded-full border px-2 py-0.5">F03 Shell</span>
        </div>
      </div>
    </aside>
  );
}

