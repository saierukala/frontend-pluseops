"use client";

import * as React from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, FilterSelect, TableToolbar, ALL, type Column } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/states";
import { platformApi, type PlatformAuditEntry } from "@/lib/api/modules/platform";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDateTime, humanize } from "@/lib/format";

// The backend filters on the exact action name
const ACTIONS = ["tenant.create", "tenant.update", "tenant.status", "tenant.plan", "tenant.delete", "tenant.admin.create", "plan.create", "plan.update", "platform_admin.create", "platform_admin.remove", "support.start", "support.end"];

function Details({ details }: { details: Record<string, unknown> | null }) {
  const entries = Object.entries(details ?? {}).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (!entries.length) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="line-clamp-2 text-xs text-muted-foreground">
      {entries.map(([k, v]) => `${humanize(k)}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`).join(" · ")}
    </span>
  );
}

/** Platform audit log (GET /platform/audit-logs): every action platform admins take, newest first. */
export default function PlatformAuditPage() {
  const { get, set, page } = useUrlState();
  const action = get("action", ALL);
  const tenantId = get("tenant", ALL);
  const from = get("from");
  const to = get("to");

  const tenants = useQuery({ queryKey: ["platform", "tenants", "options"], queryFn: () => platformApi.listTenants({ page: 1, limit: 100 }) });
  const query = useQuery({
    queryKey: ["platform", "audit", { page, action, tenantId, from, to }],
    queryFn: () =>
      platformApi.listAuditLogsEnvelope({
        page,
        limit: 25,
        action: action === ALL ? undefined : action,
        tenantId: tenantId === ALL ? undefined : tenantId,
        from: from || undefined,
        to: to || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const columns: Column<PlatformAuditEntry>[] = [
    { key: "when", header: "When", cell: (a) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(a.createdAt)}</span> },
    { key: "action", header: "Action", cell: (a) => <div><p className="font-medium">{humanize(a.action)}</p><p className="font-mono text-[11px] text-muted-foreground">{a.action}</p></div> },
    {
      key: "tenant",
      header: "Tenant",
      cell: (a) => (a.tenant ? <Link href={`/platform/tenants/${a.tenant.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>{a.tenant.name}</Link> : <span className="text-muted-foreground">Platform</span>),
    },
    { key: "actor", header: "By", cell: (a) => <span className="truncate">{a.actor?.email ?? "system"}</span>, headerClassName: "hidden md:table-cell", className: "hidden md:table-cell" },
    { key: "details", header: "Details", cell: (a) => <Details details={a.details} />, headerClassName: "hidden lg:table-cell max-w-sm", className: "hidden lg:table-cell max-w-sm" },
    { key: "ip", header: "IP", cell: (a) => <span className="font-mono text-xs text-muted-foreground">{a.ipAddress ?? "—"}</span>, headerClassName: "hidden xl:table-cell", className: "hidden xl:table-cell" },
  ];

  return (
    <PageBody>
      <PageHeader title="Platform audit log" description="Tenant changes, plan moves, admin changes and support sessions, with who did them and from where." />
      <Card className="gap-0 py-0">
        <TableToolbar>
          <FilterSelect value={action} onChange={(v) => set({ action: v })} allLabel="All actions" options={ACTIONS.map((a) => ({ value: a, label: humanize(a) }))} />
          <FilterSelect value={tenantId} onChange={(v) => set({ tenant: v })} allLabel="All tenants" options={(tenants.data ?? []).map((t) => ({ value: t.id, label: t.name }))} />
          <div className="flex items-center gap-2 sm:ml-auto">
            <Input type="date" aria-label="From" value={from} max={to || undefined} onChange={(e) => set({ from: e.target.value })} className="w-40" />
            <span className="text-muted-foreground">–</span>
            <Input type="date" aria-label="To" value={to} min={from || undefined} onChange={(e) => set({ to: e.target.value })} className="w-40" />
          </div>
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={query.data?.data}
          rowKey={(a) => a.id}
          loading={query.isFetching}
          error={query.error}
          onRetry={() => query.refetch()}
          meta={query.data?.meta}
          onPageChange={(p) => set({ page: p })}
          empty={<EmptyState icon={ScrollText} title="Nothing logged" description="No platform actions match these filters." />}
        />
      </Card>
    </PageBody>
  );
}
