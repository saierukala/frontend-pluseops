"use client";

import * as React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DataTable, FilterSelect, TableToolbar, ALL, type Column } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { EmptyState } from "@/components/app/states";
import { UserAvatar } from "@/components/layout/app-sidebar";
import { usersApi } from "@/lib/api/modules/users";
import type { QueryParams } from "@/lib/api/query";
import type { SuccessEnvelope } from "@/lib/api/types";
import { usePermission } from "@/lib/auth/permission-context";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDateTime, fullName, humanize, shortId, tidyIds } from "@/lib/format";

/** Fields shared by audit and activity log rows. */
interface LogRow {
  id: string;
  userId?: string | null;
  action: string;
  resource?: string | null;
  resourceId?: string | null;
  /** Activity rows describe the event in words instead of a resource. */
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export const AUDIT_ACTIONS = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "EXPORT", "IMPORT"];

/**
 * Shared table + detail sheet for audit logs (action + resource + field diff) and activity logs
 * (dotted event name + description). `actions` enables the action filter.
 */
export function LogViewer({
  queryKey,
  fetchPage,
  actions,
}: {
  queryKey: string;
  fetchPage: (params: QueryParams) => Promise<SuccessEnvelope<LogRow[]>>;
  actions?: string[];
}) {
  const { hasPermission } = usePermission();
  const { get, set, page } = useUrlState();
  const action = get("action", ALL);
  const userId = get("user", ALL);
  const [selected, setSelected] = React.useState<LogRow | null>(null);

  const users = useQuery({ queryKey: ["users", "options"], queryFn: () => usersApi.listEnvelope({ limit: 100 }), enabled: hasPermission("user:read") });
  const userById = new Map((users.data?.data ?? []).map((u) => [u.id, u]));
  const query = useQuery({
    queryKey: [queryKey, { page, action, userId }],
    queryFn: () => fetchPage({ page, limit: 25, action: action === ALL ? undefined : action, userId: userId === ALL ? undefined : userId }),
    placeholderData: keepPreviousData,
  });

  const actor = (id?: string | null) => (id ? userById.get(id) : undefined);
  const columns: Column<LogRow>[] = [
    { key: "when", header: "When", cell: (l) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(l.createdAt)}</span> },
    {
      key: "who",
      header: "Actor",
      cell: (l) => {
        const u = actor(l.userId);
        return u ? (
          <div className="flex items-center gap-2">
            <UserAvatar first={u.firstName} last={u.lastName} className="size-6 rounded-full" />
            <span className="truncate">{fullName(u)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">{l.userId ? `User ${shortId(l.userId)}` : "System"}</span>
        );
      },
    },
    { key: "action", header: "Action", cell: (l) => <StatusPill status={l.action} label={l.action.includes(".") ? humanize(l.action) : undefined} tone={l.action.includes(".") ? "neutral" : undefined} /> },
    {
      key: "resource",
      header: actions ? "Resource" : "Details",
      cell: (l) =>
        l.description ? (
          <span className="line-clamp-1 text-muted-foreground">{tidyIds(l.description)}</span>
        ) : (
          <span>
            {humanize(l.resource)}
            {l.resourceId ? <span className="ml-1.5 font-mono text-xs text-muted-foreground">{shortId(l.resourceId)}</span> : null}
          </span>
        ),
    },
    { key: "ip", header: "IP", cell: (l) => <span className="font-mono text-xs text-muted-foreground">{l.ipAddress ?? "—"}</span>, headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell" },
  ];

  return (
    <>
      <Card className="gap-0 py-0">
        <TableToolbar>
          {actions ? <FilterSelect value={action} onChange={(v) => set({ action: v })} allLabel="All actions" options={actions.map((a) => ({ value: a, label: humanize(a) }))} /> : null}
          {users.data ? <FilterSelect value={userId} onChange={(v) => set({ user: v })} allLabel="All actors" options={users.data.data.map((u) => ({ value: u.id, label: fullName(u) }))} className="sm:w-52" /> : null}
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={query.data?.data}
          rowKey={(l) => l.id}
          loading={query.isFetching}
          error={query.error}
          onRetry={() => query.refetch()}
          meta={query.data?.meta}
          onPageChange={(p) => set({ page: p })}
          onRowClick={setSelected}
          empty={<EmptyState icon={ScrollText} title="No log entries" description="Matching events will appear here." />}
        />
      </Card>
      <Sheet open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <StatusPill status={selected.action} label={selected.action.includes(".") ? humanize(selected.action) : undefined} /> {selected.description ? null : humanize(selected.resource)}
                </SheetTitle>
                <SheetDescription>
                  {formatDateTime(selected.createdAt)} · {actor(selected.userId) ? fullName(actor(selected.userId)) : selected.userId ? `User ${shortId(selected.userId)}` : "System"}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6 text-sm">
                <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-2">
                  <dt className="text-muted-foreground">Resource ID</dt>
                  <dd className="break-all font-mono text-xs">{selected.resourceId ?? "—"}</dd>
                  <dt className="text-muted-foreground">IP address</dt>
                  <dd className="font-mono text-xs">{selected.ipAddress ?? "—"}</dd>
                  <dt className="text-muted-foreground">User agent</dt>
                  <dd className="break-all text-xs">{selected.userAgent ?? "—"}</dd>
                </dl>
                {selected.description ? <p>{tidyIds(selected.description)}</p> : null}
                {selected.metadata && Object.keys(selected.metadata).length ? (
                  <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs">{JSON.stringify(selected.metadata, null, 2)}</pre>
                ) : null}
                {selected.oldValue || selected.newValue ? <ChangeDiff before={selected.oldValue} after={selected.newValue} /> : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function ChangeDiff({ before, after }: { before?: Record<string, unknown> | null; after?: Record<string, unknown> | null }) {
  const keys = Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]));
  if (!keys.length) return <p className="text-muted-foreground">No field changes recorded.</p>;
  const show = (v: unknown) => (v === undefined ? "—" : typeof v === "string" ? v : JSON.stringify(v));
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-3 border-b bg-muted/40 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>Field</span>
        <span>Before</span>
        <span>After</span>
      </div>
      {keys.map((k) => (
        <div key={k} className="grid grid-cols-3 gap-2 border-b px-3 py-2 last:border-0">
          <span className="font-medium">{k}</span>
          <span className="break-all font-mono text-xs text-destructive/90">{show(before?.[k])}</span>
          <span className="break-all font-mono text-xs text-success">{show(after?.[k])}</span>
        </div>
      ))}
    </div>
  );
}
