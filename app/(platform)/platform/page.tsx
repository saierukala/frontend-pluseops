"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { platformApi } from "@/lib/api/modules/platform";
import type { Tenant } from "@/lib/api/types";

export default function PlatformOverviewPage() {
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const envelope = await platformApi.listTenantsEnvelope({ page: 1, limit: 20 });
        if (cancelled) return;
        setTenants(envelope.data as unknown as Tenant[]);
        setTotal((envelope.meta?.total as number) ?? (envelope.data as unknown as Tenant[]).length);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load platform overview";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const stats = React.useMemo(() => {
    const byStatus = { ACTIVE: 0, TRIAL: 0, SUSPENDED: 0, CANCELLED: 0 };
    tenants.forEach((t) => {
      const s = t.status as keyof typeof byStatus;
      if (s in byStatus) byStatus[s]++;
    });
    return byStatus;
  }, [tenants]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map((i)=> <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Failed to load overview</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Verify platform JWT has scope=platform and platform:tenant:read permission.</p>
          <p className="mt-2 text-xs">Request ID is available in response headers for troubleshooting.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Platform Overview</h1>
          <p className="text-sm text-muted-foreground">Control plane — tenant provisioning, administration and operations.</p>
        </div>
        <Button asChild>
          <Link href="/platform/tenants">Manage tenants</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Total tenants</CardDescription><CardTitle className="text-3xl">{total}</CardTitle></CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">Excluding internal __platform</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Active</CardDescription><CardTitle className="text-3xl text-emerald-600">{stats.ACTIVE}</CardTitle></CardHeader>
          <CardContent><Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">ACTIVE</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Trial</CardDescription><CardTitle className="text-3xl text-blue-600">{stats.TRIAL}</CardTitle></CardHeader>
          <CardContent><Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">TRIAL</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Suspended / Cancelled</CardDescription><CardTitle className="text-3xl text-amber-600">{stats.SUSPENDED + stats.CANCELLED}</CardTitle></CardHeader>
          <CardContent><p className="text-xs text-muted-foreground">Operational risk group</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent tenants</CardTitle>
            <CardDescription>Latest 5 platform tenants by creation date</CardDescription>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No tenants yet. Create the first workspace to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {tenants.slice(0,5).map((t) => (
                  <Link key={t.id} href={`/platform/tenants/${t.id}` as unknown as never} className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-accent transition-colors focus-visible:ring-2 focus-visible:ring-ring">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{t.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{t.slug} • {t.plan ?? "free"}</div>
                    </div>
                    <Badge variant={t.status === "ACTIVE" ? "default" : t.status === "TRIAL" ? "secondary" : "outline"}>{t.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Platform scope</CardTitle>
            <CardDescription>Security boundary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p><span className="font-medium text-foreground">JWT scope=platform</span> is required for all /platform/* calls.</p>
            <p>Tenant tokens (<code className="rounded bg-muted px-1">scope=tenant</code>) are rejected with 403 PLATFORM_TOKEN_FORBIDDEN.</p>
            <p>Tenant identity is authoritative from JWT — no client-controlled tenantId determines authorization.</p>
            <div className="pt-2">
              <Button variant="outline" size="sm" asChild><Link href="/platform/tenants">Go to tenants</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Quick links</CardTitle>
          <CardDescription>Only wired items use real backend APIs. Unwired items are explicitly marked as Soon.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">Tenants — live</Badge>
          <Badge variant="outline">Users — Soon</Badge>
          <Badge variant="outline">Audit — Soon</Badge>
          <Badge variant="outline">System — Soon</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
