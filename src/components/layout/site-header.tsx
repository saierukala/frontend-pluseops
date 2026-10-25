"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Moon, Search, Sun } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { notificationsApi } from "@/lib/api/modules/notifications";
import { usePermission } from "@/lib/auth/permission-context";
import { formatRelative, tidyIds } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNavFilter } from "./app-sidebar";
import type { NavGroup } from "./nav-config";

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Workspace",
  users: "Team",
  new: "New",
  "low-stock": "Low stock",
  platform: "Platform",
  system: "System health",
};

function useBreadcrumbs(groups: NavGroup[]) {
  const pathname = usePathname();
  return React.useMemo(() => {
    const labels = new Map<string, string>();
    for (const g of groups) {
      for (const item of g.items) {
        labels.set(item.href, item.label);
        item.children?.forEach((c) => labels.set(c.href, c.label === "Overview" || c.label === "All orders" || c.label === "Stock levels" ? item.label : c.label));
      }
    }
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((segment, i) => {
      const href = `/${parts.slice(0, i + 1).join("/")}`;
      const isId = /^[0-9a-f-]{20,}$/i.test(segment);
      return { href, label: labels.get(href) ?? (isId ? "Details" : SEGMENT_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)) };
    });
  }, [pathname, groups]);
}

export function SiteHeader({ groups, kind }: { groups: NavGroup[]; kind: "tenant" | "platform" }) {
  const crumbs = useBreadcrumbs(groups);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 rounded-t-xl border-b bg-background/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-1 !h-5" />
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1.5 text-sm">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={c.href} className={cn("flex min-w-0 items-center gap-1.5", !last && "hidden md:flex")}>
                {last ? (
                  <span className="truncate font-medium" aria-current="page">
                    {c.label}
                  </span>
                ) : (
                  <>
                    <Link href={c.href as never} className="truncate text-muted-foreground transition-colors hover:text-foreground">
                      {c.label}
                    </Link>
                    <span className="text-muted-foreground/50" aria-hidden>
                      /
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <Button
        variant="outline"
        onClick={() => setPaletteOpen(true)}
        className="h-9 gap-2 px-2.5 text-muted-foreground sm:w-56 sm:justify-start"
        aria-label="Search and jump to"
      >
        <Search />
        <span className="hidden text-sm font-normal sm:inline">Search…</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
          Ctrl K
        </kbd>
      </Button>
      {kind === "tenant" ? <NotificationsBell /> : null}
      <ThemeToggle />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} groups={groups} kind={kind} />
    </header>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </Button>
  );
}

function NotificationsBell() {
  const { hasPermission } = usePermission();
  const canRead = hasPermission("notification:read");
  const canUpdate = hasPermission("notification:update");
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const { data } = useQuery({
    queryKey: ["notifications", "bell"],
    queryFn: () => notificationsApi.listEnvelope({ limit: 8 }),
    enabled: canRead,
    refetchInterval: 60_000,
  });
  const unread = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationsApi.listEnvelope({ limit: 1, isRead: false }),
    enabled: canRead,
    refetchInterval: 60_000,
  });
  const unreadCount = unread.data?.meta?.total ?? 0;

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (!canRead) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}>
          <Bell />
          {unreadCount ? (
            <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">{unreadCount ? `${unreadCount} unread` : "You're all caught up"}</p>
          </div>
          {canUpdate && unreadCount ? (
            <Button variant="ghost" size="sm" onClick={() => markAll.mutate()} loading={markAll.isPending}>
              <CheckCheck /> Mark all read
            </Button>
          ) : null}
        </div>
        <ScrollArea className="max-h-80">
          {data?.data.length ? (
            <ul className="divide-y">
              {data.data.map((n) => (
                <li key={n.id} className="flex gap-3 px-4 py-3">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.isRead ? "bg-transparent" : "bg-primary")} aria-hidden />
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{tidyIds(n.message)}</p>
                    <p className="text-[11px] text-muted-foreground/80">{formatRelative(n.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">No notifications yet</p>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Button variant="ghost" className="w-full" asChild onClick={() => setOpen(false)}>
            <Link href={"/notifications" as never}>View all</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const QUICK_ACTIONS = [
  { label: "Create order", href: "/orders/new", permission: "order:create" },
  { label: "Add product", href: "/products?new=1", permission: "product:create" },
  { label: "Add customer", href: "/customers?new=1", permission: "customer:create" },
  { label: "Adjust stock", href: "/inventory?adjust=1", permission: "inventory:update" },
] as const;

function CommandPalette({ open, onOpenChange, groups, kind }: { open: boolean; onOpenChange: (open: boolean) => void; groups: NavGroup[]; kind: "tenant" | "platform" }) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { canSee } = useNavFilter(kind);
  const { hasPermission } = usePermission();

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href as never);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command palette" description="Jump to a page or run an action">
      <CommandInput placeholder="Type a page or action…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {kind === "tenant" ? (
          <CommandGroup heading="Quick actions">
            {QUICK_ACTIONS.filter((a) => hasPermission(a.permission)).map((a) => (
              <CommandItem key={a.href} onSelect={() => go(a.href)}>
                {a.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {groups.map((g) => {
          const items = g.items.filter(canSee).flatMap((item) => {
            const children = item.children?.filter(canSee);
            return children?.length
              ? children.map((c) => ({ ...item, href: c.href, label: c.href === item.href ? item.label : `${item.label} · ${c.label}` }))
              : [item];
          });
          if (!items.length) return null;
          return (
            <CommandGroup key={g.label} heading={g.label}>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem key={item.href} value={`${item.label} ${item.keywords?.join(" ") ?? ""}`} onSelect={() => go(item.href)}>
                    <Icon className="text-muted-foreground" />
                    {item.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}
        <CommandSeparator />
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => { setTheme("light"); onOpenChange(false); }}>
            <Sun className="text-muted-foreground" /> Light
          </CommandItem>
          <CommandItem onSelect={() => { setTheme("dark"); onOpenChange(false); }}>
            <Moon className="text-muted-foreground" /> Dark
            <CommandShortcut>Theme</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
