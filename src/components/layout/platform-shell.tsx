"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { platformNavGroups } from "./nav-config";
import { NavIcon } from "./nav-icon";
import { PlatformBrand } from "./brand";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { MobileDrawer } from "./mobile-drawer";

function PlatformSidebar({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className={cn("flex w-[272px] shrink-0 flex-col border-r bg-[#0f172a] text-slate-200", className)}>
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <PlatformBrand className="text-white" />
      </div>
      <div className="border-b border-white/10 px-3 py-3">
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur">
          <div className="text-xs font-semibold tracking-wide text-white">Platform Admin</div>
          <div className="text-xs text-slate-400">Internal • no tenant scope</div>
          <div className="mt-2 inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-200 border border-amber-500/20">BACKEND DEPENDENCY</div>
        </div>
      </div>
      <nav aria-label="Platform navigation" className="flex-1 overflow-y-auto px-2 py-3">
        <div className="flex flex-col gap-5">
          {platformNavGroups.map((group) => (
            <div key={group.label}>
              <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</div>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href as unknown as never}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/20",
                          active ? "bg-white text-slate-900 shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <NavIcon name={item.icon} className={cn(active ? "text-slate-700" : "text-slate-400")} />
                        <span className="flex-1 truncate font-medium">{item.label}</span>
                        {item.badge ? <Badge variant="outline" size="sm" className="bg-white/10 text-slate-200 border-white/20 text-[10px]">{item.badge}</Badge> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs font-semibold text-white">Platform scope</div>
          <p className="mt-1 text-xs leading-5 text-slate-400">Platform routes are UI-only in F03. No GET /platform/* calls — backend not exposed.</p>
        </div>
      </div>
    </aside>
  );
}

function PlatformTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function onDoc(e: MouseEvent) { if (!ref.current?.contains(e.target as Node)) setOpen(false); }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDoc); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-3 backdrop-blur sm:px-4 lg:px-6">
      <button aria-label="Open navigation" onClick={onMenuClick} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:bg-accent lg:hidden focus-visible:ring-2 focus-visible:ring-ring">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">Platform • {pathname}</div>
        <div className="hidden truncate text-xs text-muted-foreground sm:block">Administrative control plane — separate from tenant workspaces.</div>
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">UI structure only</span>
        <span className="hidden h-6 w-px bg-border sm:block" aria-hidden />
      </div>
      <div ref={ref} className="relative">
        <button aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(v=>!v)} className="inline-flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar fallback="PA" size="sm" />
          <span className="hidden text-sm font-medium sm:inline">Platform Admin</span>
        </button>
        {open ? (
          <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-xl border bg-popover p-1 shadow-lg">
            <div className="px-3 py-2 text-sm font-semibold">Platform Admin</div>
            <div className="px-3 pb-2 text-xs text-muted-foreground">platform@pulseops.test — no platform API calls in F03</div>
            <div className="my-1 h-px bg-border" />
            <Link href={"/dashboard" as unknown as never} onClick={()=>setOpen(false)} className="flex rounded-md px-2.5 py-2 text-sm hover:bg-accent">← Back to tenant</Link>
            <button role="menuitem" className="flex w-full rounded-md px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10" onClick={()=>setOpen(false)}>Sign out</button>
          </div>
        ): null}
      </div>
    </header>
  );
}

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);
  return (
    <div className="flex min-h-screen bg-muted/20">
      <div className="hidden lg:flex lg:shrink-0">
        <PlatformSidebar className="sticky top-0 h-screen overflow-hidden" />
      </div>
      <MobileDrawer open={mobileOpen} onOpenChange={setMobileOpen}>
        <PlatformSidebar className="h-full w-full" onNavigate={()=>setMobileOpen(false)} />
      </MobileDrawer>
      <div className="flex min-w-0 flex-1 flex-col">
        <PlatformTopbar onMenuClick={()=>setMobileOpen(true)} />
        <main className="flex-1 min-w-0 bg-background">
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

