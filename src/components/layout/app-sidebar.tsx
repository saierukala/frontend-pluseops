"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Activity, ChevronRight, ChevronsUpDown, LogOut, Monitor, Moon, Settings, Sun, UserRound } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AvatarPrimitive, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/auth-context";
import { usePermission } from "@/lib/auth/permission-context";
import { workspaceApi } from "@/lib/api/modules/tenants";
import { fullName, humanize, initials } from "@/lib/format";
import type { NavGroup, NavItem } from "./nav-config";

type Variant = "tenant" | "platform";

export function useNavFilter(variant: Variant) {
  const { hasPermission, hasAnyPermission, isReady } = usePermission();
  const canSee = React.useCallback(
    (item: { requiredPermission?: string; requiredAnyPermissions?: string[] }) => {
      // Platform routes are gated by scope at the layout; permissions there are platform-wide
      if (variant === "platform") return true;
      if (item.requiredPermission && !hasPermission(item.requiredPermission)) return false;
      if (item.requiredAnyPermissions && !hasAnyPermission(item.requiredAnyPermissions)) return false;
      return true;
    },
    [variant, hasPermission, hasAnyPermission]
  );
  return { canSee, ready: variant === "platform" || isReady };
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/platform" && pathname.startsWith(`${href}/`));
}

export function AppSidebar({ kind, groups, ...props }: { kind: Variant; groups: NavGroup[] } & React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { canSee, ready } = useNavFilter(kind);

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <WorkspaceBlock variant={kind} />
      </SidebarHeader>
      <SidebarContent>
        {!ready
          ? [0, 1].map((g) => (
              <SidebarGroup key={g}>
                <SidebarMenu>
                  {Array.from({ length: 4 }, (_, i) => (
                    <SidebarMenuItem key={i}>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))
          : groups.map((group) => {
              const items = group.items.filter(canSee);
              if (!items.length) return null;
              return (
                <SidebarGroup key={group.label}>
                  <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                  <SidebarMenu>
                    {items.map((item) => (
                      <NavEntry key={item.href} item={item} pathname={pathname} canSee={canSee} />
                    ))}
                  </SidebarMenu>
                </SidebarGroup>
              );
            })}
      </SidebarContent>
      <SidebarFooter>
        <NavUser variant={kind} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function NavEntry({ item, pathname, canSee }: { item: NavItem; pathname: string; canSee: (i: { requiredPermission?: string }) => boolean }) {
  const Icon = item.icon;
  const children = item.children?.filter(canSee);
  const groupActive = isActivePath(pathname, item.href) || Boolean(children?.some((c) => isActivePath(pathname, c.href)));

  if (!children?.length) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActivePath(pathname, item.href)} tooltip={item.label}>
          <Link href={item.href as never}>
            <Icon />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
        {item.badge ? <SidebarMenuBadge className="rounded-full border bg-background text-[10px] text-muted-foreground">{item.badge}</SidebarMenuBadge> : null}
      </SidebarMenuItem>
    );
  }

  // Exact match wins so "/orders" isn't highlighted while on "/orders/new"
  const activeChild = children.find((c) => c.href === pathname) ?? children.find((c) => pathname.startsWith(`${c.href}/`) && !children.some((o) => o.href === pathname));

  return (
    <Collapsible asChild defaultOpen={groupActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.label} isActive={groupActive}>
            <Icon />
            <span>{item.label}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {children.map((child) => (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton asChild isActive={activeChild?.href === child.href}>
                  <Link href={child.href as never}>
                    <span>{child.label}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function BrandMark({ variant }: { variant: Variant }) {
  return (
    <span
      className={
        variant === "platform"
          ? "flex aspect-square size-8 items-center justify-center rounded-lg bg-foreground text-background"
          : "flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[color-mix(in_oklch,var(--primary)_60%,var(--chart-2))] text-primary-foreground shadow-sm"
      }
      aria-hidden
    >
      <Activity className="size-4" strokeWidth={2.5} />
    </span>
  );
}

function WorkspaceBlock({ variant }: { variant: Variant }) {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { data: workspace } = useQuery({
    queryKey: ["workspace"],
    queryFn: () => workspaceApi.get(),
    enabled: variant === "tenant" && hasPermission("tenant:read"),
    staleTime: 5 * 60_000,
  });
  // /auth/me carries the tenant summary, so roles without tenant:read still see their workspace
  const tenant = workspace ?? user?.tenant;

  const title = variant === "platform" ? "PulseOps Platform" : tenant?.name ?? "PulseOps";
  const subtitle = variant === "platform" ? "Internal console" : tenant ? `${humanize(tenant.plan)} plan · ${tenant.slug}` : "Workspace";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent/60">
          <Link href={(variant === "platform" ? "/platform" : "/dashboard") as never}>
            <BrandMark variant={variant} />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{title}</span>
              <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function NavUser({ variant }: { variant: Variant }) {
  const { user, logout } = useAuth();
  const { roles } = usePermission();
  const { isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const name = fullName(user);
  const role = variant === "platform" ? "Platform admin" : humanize(roles[0]?.name ?? user?.roles?.[0]?.name ?? "member");

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <UserAvatar first={user?.firstName} last={user?.lastName} />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs text-muted-foreground">{role}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-60 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={6}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserAvatar first={user?.firstName} last={user?.lastName} />
                <div className="grid flex-1 leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {variant === "tenant" ? (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href={"/settings" as never}>
                      <UserRound /> Profile & security
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={"/settings/notifications" as never}>
                      <Settings /> Preferences
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Theme</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                <Sun /> Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon /> Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor /> System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function UserAvatar({ first, last, className }: { first?: string | null; last?: string | null; className?: string }) {
  return (
    <AvatarPrimitive className={className ?? "size-8 rounded-lg"}>
      <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">{initials(first, last)}</AvatarFallback>
    </AvatarPrimitive>
  );
}
