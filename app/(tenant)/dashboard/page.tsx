"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import { tenantsApi } from "@/lib/api/modules/tenants";
import { usersApi } from "@/lib/api/modules/users";
import type { Tenant, Role } from "@/lib/api/types";

export default function Page() {
  const { user, scope } = useAuth();
  const [tenant, setTenant] = React.useState<Tenant | null>(null);
  const [roleName, setRoleName] = React.useState<string | null>(null);
  const [roleLoading, setRoleLoading] = React.useState(false);

  React.useEffect(() => {
    if (!user?.tenantId) return;
    let cancelled = false;
    // Fetch tenant name/slug from real backend (public GET /tenants/:id). Fallback to null if unavailable.
    tenantsApi
      .getById(user.tenantId)
      .then((t) => {
        if (!cancelled) setTenant(t);
      })
      .catch(() => {
        if (!cancelled) setTenant(null);
      });
    // Fetch actual role via authenticated GET /users/:id/roles (requires tenant scope + user:read). Do not hardcode.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoleLoading(true);
    usersApi
      .getRoles(user.id)
      .then((roles: Role[]) => {
        if (cancelled) return;
        const primary = roles.find((r) => r.name === "admin") ?? roles[0];
        setRoleName(primary ? primary.name : null);
      })
      .catch(() => {
        if (!cancelled) setRoleName(null);
      })
      .finally(() => {
        if (!cancelled) setRoleLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.tenantId, user?.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Tenant workspace overview — backed by JWT scope=tenant, tenant identity authoritative from backend.</p>
      </div>

      {user && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold">
                {(user.firstName[0] + user.lastName[0]).toUpperCase()}
              </span>
              <div className="min-w-0">
                <CardTitle className="text-base">
                  {user.firstName} {user.lastName} •{" "}
                  {roleLoading ? "…" : roleName ? roleName : "member"}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">({tenant ? tenant.name : `Tenant ${user.tenantId.slice(0, 8)}…`})</span>
                </CardTitle>
                <CardDescription className="truncate">
                  {user.email} • {tenant ? `${tenant.slug} • Tenant ${tenant.id.slice(0, 8)}…` : `Tenant ${user.tenantId.slice(0, 8)}…`} • scope: {scope ?? user.scope ?? "tenant"} • status: {user.status}
                </CardDescription>
              </div>
              <Badge className="ml-auto">Tenant workspace</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Current tenant is derived from JWT/session <code className="rounded bg-muted px-1">tenantId</code> — not from localStorage or URL. Platform tokens are rejected on tenant APIs. Tenant name/slug from <code className="rounded bg-muted px-1">GET /tenants/:id</code> where available; role from <code className="rounded bg-muted px-1">GET /users/:id/roles</code>.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-base">Orders</CardTitle><CardDescription>Pending orders, processing, revenue</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground">Connects to GET /orders + GET /analytics — scope tenant only.</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Inventory</CardTitle><CardDescription>Low stock, warehouses, movements</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground">GET /inventory/low-stock, /warehouses — tenant-isolated.</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Catalog</CardTitle><CardDescription>Products, variants, categories</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground">GET /products — x-cache handling included.</CardContent></Card>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Security note</CardTitle>
          <CardDescription>No tenant ID is stored as authorization authority. Backend remains authoritative.</CardDescription>
        </CardHeader>
        <CardContent className="text-xs leading-5 text-muted-foreground">
          Tenant token cannot access <code className="rounded bg-muted px-1">/platform/*</code> (403). Platform token cannot access tenant APIs (403 PLATFORM_TOKEN_FORBIDDEN). Expired sessions trigger refresh deduplication via F04 client.
        </CardContent>
      </Card>
    </div>
  );
}
