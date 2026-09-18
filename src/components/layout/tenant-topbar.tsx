"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/ui/search-bar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function TopbarSearch({ onSearch, className }: { onSearch?: (v: string) => void; className?: string }) {
  const [value, setValue] = React.useState("");
  return (
    <div className={cn("w-full max-w-[560px]", className)}>
      <SearchBar value={value} onValueChange={setValue} onSearch={onSearch} placeholder="Search products, orders, customers…" aria-label="Search workspace" />
    </div>
  );
}

function NotificationsButton({ count = 3 }: { count?: number }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        aria-label={`Notifications, ${count} unread`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 8a6 6 0 0 1 12 0c0 7-6 5-6 9a2 2 0 0 1-4 0c0-4-6-2-6-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold leading-none text-destructive-foreground">
            {count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 rounded-xl border bg-popover p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-2">
            <div className="text-sm font-semibold">Notifications</div>
            <Badge variant="secondary" size="sm">
              {count} new
            </Badge>
          </div>
          <div className="rounded-lg border bg-card">
            {[
              { title: "New order #3821", desc: "2 items • $128.00", time: "2m ago" },
              { title: "Low stock alert", desc: "Mechanical Keyboard — 3 left", time: "1h ago" },
              { title: "Payment confirmed", desc: "Order #3809 — $412.00", time: "3h ago" },
            ].map((n) => (
              <div key={n.title} className="flex gap-3 border-b px-3 py-3 last:border-0 hover:bg-muted/50">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{n.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{n.desc}</div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{n.time}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-2 pt-2">
            <Link href={"/notifications" as unknown as never} onClick={() => setOpen(false)} className="text-xs font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring rounded">
              View all
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              Mark all read
            </button>
          </div>
          <p className="px-2 pt-2 text-[11px] leading-4 text-muted-foreground">UI only — no notification API calls in F03. Backend: GET /notifications (future).</p>
        </div>
      ) : null}
    </div>
  );
}

function UserMenu() {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5 pr-2.5 text-left hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Avatar fallback="AS" size="sm" />
        <span className="hidden min-w-0 flex-col items-start sm:flex">
          <span className="max-w-[120px] truncate text-sm font-medium leading-none">Aarav Shah</span>
          <span className="max-w-[120px] truncate text-xs text-muted-foreground">Admin • Acme</span>
        </span>
        <svg viewBox="0 0 24 24" className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-xl border bg-popover p-1 shadow-lg">
          <div className="px-3 py-2.5">
            <div className="text-sm font-semibold">Aarav Shah</div>
            <div className="truncate text-xs text-muted-foreground">aarav@acme.test</div>
            <div className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">Role: tenant_admin</div>
          </div>
          <div className="my-1 h-px bg-border" />
          <button role="menuitem" className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none" onClick={() => setOpen(false)}>
            <span className="inline-flex h-4 w-4 items-center justify-center">👤</span> Profile
          </button>
          <button role="menuitem" className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-accent" onClick={() => setOpen(false)}>
            <span className="inline-flex h-4 w-4 items-center justify-center">⚙️</span> Settings
          </button>
          <button role="menuitem" className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground" onClick={() => setOpen(false)}>
            <span className="inline-flex h-4 w-4 items-center justify-center">🎨</span> Theme — system
          </button>
          <div className="my-1 h-px bg-border" />
          <button
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10"
            onClick={() => setOpen(false)}
          >
            Sign out
          </button>
          <p className="px-2.5 py-1.5 text-[11px] leading-4 text-muted-foreground">Auth actions are UI only in F03 — no API calls.</p>
        </div>
      ) : null}
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("system");
  // purely visual toggle — no actual theme switching yet (prefers-color-scheme is active via CSS)
  return (
    <div className="hidden items-center gap-1 rounded-full border bg-muted p-1 sm:inline-flex" role="group" aria-label="Theme">
      {(["light", "system", "dark"] as const).map((t) => (
        <button
          key={t}
          aria-pressed={theme === t}
          onClick={() => setTheme(t)}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors focus-visible:ring-2 focus-visible:ring-ring",
            theme === t ? "bg-card shadow-xs border" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function TenantTopbar({
  onMenuClick,
  onSearch,
}: {
  onMenuClick?: () => void;
  onSearch?: (v: string) => void;
}) {
  const pathname = usePathname();
  const breadcrumb = React.useMemo(() => {
    const segs = pathname.split("/").filter(Boolean);
    if (segs.length === 0) return "Overview";
    // humanize last segment
    const last = segs[segs.length - 1];
    return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ");
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-4 lg:px-6">
      <button
        aria-label="Open navigation"
        onClick={onMenuClick}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="hidden min-w-0 flex-col lg:flex">
        <div className="text-sm font-semibold leading-none tracking-tight">{breadcrumb}</div>
        <div className="truncate text-xs text-muted-foreground">Tenant workspace • {pathname}</div>
      </div>

      <div className="flex flex-1 justify-center lg:justify-center">
        <TopbarSearch onSearch={onSearch} className="hidden md:flex" />
        <Button variant="outline" size="sm" className="md:hidden" aria-label="Search" onClick={() => document.getElementById("mobile-search")?.focus()}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3-3" />
          </svg>
          Search
        </Button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <ThemeToggle />
        <NotificationsButton />
        <span className="hidden h-6 w-px bg-border sm:block" aria-hidden />
        <UserMenu />
      </div>
    </header>
  );
}

