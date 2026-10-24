"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Building2, ShoppingCart, Users, Wallet } from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { KpiCard } from "@/components/app/kpi-card";
import { DataTable, type Column } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { ErrorState } from "@/components/app/states";
import { platformApi, type MoneyByCurrency, type PlatformAuditEntry } from "@/lib/api/modules/platform";
import type { Tenant } from "@/lib/api/types";
import { formatDateTime, formatMoney, formatNumber, formatRelative, humanize } from "@/lib/format";

const money = (list?: MoneyByCurrency) => (list?.length ? list.map((m) => formatMoney(m.amount, m.currency)).join(" · ") : formatMoney(0));

function Breakdown({ title, counts, total }: { title: string; counts?: Record<string, number>; total?: number }) {
  const entries = Object.entries(counts ?? {}).sort((a, b) => b[1] - a[1]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!counts ? <Skeleton className="h-24" /> : null}
        {entries.map(([key, count]) => (
          <div key={key} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span>{humanize(key)}</span>
              <span className="tabular text-muted-foreground">{formatNumber(count)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** Platform overview (GET /platform/overview), newest tenants and the latest platform actions. */
export default function PlatformOverviewPage() {
  const router = useRouter();
  const overview = useQuery({ queryKey: ["platform", "overview"], queryFn: () => platformApi.getOverview() });
  const tenants = useQuery({ queryKey: ["platform", "tenants", "recent"], queryFn: () => platformApi.listTenantsEnvelope({ page: 1, limit: 5 }) });
  const audit = useQuery({ queryKey: ["platform", "audit", "recent"], queryFn: () => platformApi.listAuditLogsEnvelope({ page: 1, limit: 6 }) });
  const o = overview.data;

  const tenantColumns: Column<Tenant & { usersCount?: number; lastActivityAt?: string | null }>[] = [
    { key: "name", header: "Tenant", cell: (t) => <div><p className="font-medium">{t.name}</p><p className="font-mono text-xs text-muted-foreground">{t.slug}</p></div> },
    { key: "plan", header: "Plan", cell: (t) => <span className="capitalize">{(t as { plan?: string }).plan ?? "free"}</span> },
    { key: "users", header: "Users", cell: (t) => <span className="tabular">{formatNumber(t.usersCount ?? 0)}</span>, headerClassName: "hidden sm:table-cell", className: "hidden sm:table-cell" },
    { key: "status", header: "Status", cell: (t) => <StatusPill status={t.status} /> },
    { key: "active", header: "Last activity", cell: (t) => <span className="text-muted-foreground">{t.lastActivityAt ? formatRelative(t.lastActivityAt) : "—"}</span>, headerClassName: "hidden md:table-cell", className: "hidden md:table-cell" },
  ];

  return (
    <PageBody>
      <PageHeader
        title="Platform overview"
        description="Every workspace on PulseOps at a glance."
        actions={<Button asChild><Link href="/platform/tenants">Manage tenants</Link></Button>}
      />
      {overview.error ? <ErrorState error={overview.error} onRetry={() => overview.refetch()} /> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Tenants" icon={Building2} loading={overview.isLoading} value={formatNumber(o?.tenants.total)} hint={`${formatNumber(o?.tenants.byStatus.ACTIVE ?? 0)} active`} />
        <KpiCard label="Active users" icon={Users} loading={overview.isLoading} value={formatNumber(o?.users.active)} />
        <KpiCard label="Orders" icon={ShoppingCart} loading={overview.isLoading} value={formatNumber(o?.orders.total)} hint={`${formatNumber(o?.orders.last30Days ?? 0)} in the last 30 days`} />
        <KpiCard label="Revenue (completed)" icon={Wallet} tone="success" loading={overview.isLoading} value={money(o?.revenue.total)} hint={`${money(o?.revenue.last30Days)} in the last 30 days`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Breakdown title="Tenants by status" counts={o?.tenants.byStatus} total={o?.tenants.total} />
        <Breakdown title="Tenants by plan" counts={o?.tenants.byPlan} total={o?.tenants.total} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New tenants per month</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {!o ? <Skeleton className="h-24" /> : null}
            {o?.tenants.newByMonth.slice(-6).map((m) => (
              <div key={m.month} className="flex justify-between text-sm">
                <span>{m.month}</span>
                <span className="tabular text-muted-foreground">{formatNumber(m.count)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="gap-0 py-0 lg:col-span-3">
          <CardHeader className="border-b py-4">
            <CardTitle className="text-base">Newest tenants</CardTitle>
            <CardAction><Button variant="ghost" size="sm" asChild><Link href="/platform/tenants">All tenants</Link></Button></CardAction>
          </CardHeader>
          <DataTable columns={tenantColumns} rows={tenants.data?.data as never} rowKey={(t) => t.id} loading={tenants.isFetching} error={tenants.error} onRetry={() => tenants.refetch()} onRowClick={(t) => router.push(`/platform/tenants/${t.id}` as never)} skeletonRows={5} />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent platform actions</CardTitle>
            <CardDescription>Who changed what across tenants.</CardDescription>
            <CardAction><Button variant="ghost" size="sm" asChild><Link href="/platform/audit">Audit log</Link></Button></CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {audit.isLoading ? <Skeleton className="h-40" /> : null}
            {audit.data?.data.map((a: PlatformAuditEntry) => (
              <div key={a.id} className="flex flex-col gap-0.5 border-b pb-3 last:border-0 last:pb-0">
                <p className="text-sm"><span className="font-medium">{humanize(a.action)}</span>{a.tenant ? <span className="text-muted-foreground"> · {a.tenant.name}</span> : null}</p>
                <p className="text-xs text-muted-foreground">{a.actor?.email ?? "system"} · {formatDateTime(a.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageBody>
  );
}
