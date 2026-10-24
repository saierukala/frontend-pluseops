"use client";

import * as React from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, Download, FileSpreadsheet, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-primitive";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, FilterSelect, TableToolbar, ALL, type Column } from "@/components/app/data-table";
import { RowActions } from "@/components/app/row-actions";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { StatusPill } from "@/components/app/status-pill";
import { EmptyState } from "@/components/app/states";
import { NewReportDialog, ScheduleDialog, REPORT_TYPES, useAllowedReportTypes } from "@/features/reports/report-dialogs";
import { reportsApi, type Report, type ReportSchedule, type ReportStatus, type ReportType } from "@/lib/api/modules/reports";
import { apiAssetUrl } from "@/lib/api/config";
import { usePermission } from "@/lib/auth/permission-context";
import { useUrlState } from "@/hooks/use-url-state";
import { toastError } from "@/lib/api-errors";
import { formatDate, formatDateTime, formatNumber, formatRelative, humanize } from "@/lib/format";

const typeLabel = (t: ReportType) => REPORT_TYPES.find((x) => x.value === t)?.label ?? humanize(t);

function filterSummary(r: Pick<Report, "filters">) {
  const f = r.filters ?? {};
  const parts = [];
  if (f.from || f.to) parts.push(f.from === f.to ? f.from : `${f.from ?? "…"} → ${f.to ?? "…"}`);
  if (f.status) parts.push(humanize(f.status));
  if (f.warehouseId) parts.push("one warehouse");
  return parts.join(" · ") || "Everything";
}

function formatBytes(n: number | null) {
  if (n == null) return "—";
  return n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function ExportsTab({ canCreate }: { canCreate: boolean }) {
  const { get, set, page } = useUrlState();
  const type = get("type", ALL);
  const status = get("status", ALL);
  const [creating, setCreating] = React.useState(false);
  const query = useQuery({
    queryKey: ["reports", { page, type, status }],
    queryFn: () => reportsApi.listEnvelope({ page, limit: 20, type: type === ALL ? undefined : (type as ReportType), status: status === ALL ? undefined : (status as ReportStatus) }),
    placeholderData: keepPreviousData,
    // The worker builds exports in the background: poll while any is still running
    refetchInterval: (q) => (q.state.data?.data.some((r) => r.status === "PENDING" || r.status === "PROCESSING") ? 2000 : false),
  });
  const download = useMutation({
    // Browsers ignore `download` names on cross-origin links, so fetch the signed file and save it under its real name
    mutationFn: async (r: Report) => {
      const link = await reportsApi.download(r.id);
      const res = await fetch(apiAssetUrl(link.url));
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      return { blob: await res.blob(), fileName: link.fileName };
    },
    onSuccess: ({ blob, fileName }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    onError: (e) => toastError(e, "Couldn't download the export"),
  });

  const columns: Column<Report>[] = [
    {
      key: "report",
      header: "Export",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground"><FileSpreadsheet className="size-4" /></span>
          <div className="min-w-0">
            <p className="font-medium">{typeLabel(r.type)} {r.scheduleId ? <span className="text-xs font-normal text-muted-foreground">· scheduled</span> : null}</p>
            <p className="truncate text-xs text-muted-foreground">{filterSummary(r)}</p>
          </div>
        </div>
      ),
    },
    { key: "rows", header: "Rows", cell: (r) => <span className="tabular">{r.rowCount == null ? "—" : formatNumber(r.rowCount)}</span>, headerClassName: "hidden sm:table-cell", className: "hidden sm:table-cell" },
    { key: "size", header: "Size", cell: (r) => <span className="tabular text-muted-foreground">{formatBytes(r.sizeBytes)}</span>, headerClassName: "hidden md:table-cell", className: "hidden md:table-cell" },
    { key: "status", header: "Status", cell: (r) => <div className="flex flex-col gap-0.5"><StatusPill status={r.status} />{r.error ? <span className="text-xs text-destructive">{r.error}</span> : null}</div> },
    { key: "created", header: "Requested", cell: (r) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(r.createdAt)}</span>, headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell" },
    { key: "expires", header: "Deleted", cell: (r) => <span className="whitespace-nowrap text-muted-foreground">{r.expiresAt ? formatDate(r.expiresAt) : "Kept"}</span>, headerClassName: "hidden xl:table-cell", className: "hidden xl:table-cell" },
    {
      key: "download",
      header: "",
      cell: (r) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" disabled={r.status !== "COMPLETED"} loading={download.isPending && download.variables?.id === r.id} onClick={() => download.mutate(r)}>
            <Download /> CSV
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card className="gap-0 py-0">
        <TableToolbar>
          <FilterSelect value={type} onChange={(v) => set({ type: v })} allLabel="All data" options={REPORT_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
          <FilterSelect value={status} onChange={(v) => set({ status: v })} allLabel="All statuses" options={["PENDING", "PROCESSING", "COMPLETED", "FAILED"].map((s) => ({ value: s, label: humanize(s) }))} />
          {canCreate ? <Button className="sm:ml-auto" onClick={() => setCreating(true)}><Plus /> New export</Button> : null}
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={query.data?.data}
          rowKey={(r) => r.id}
          loading={query.isFetching && !query.data}
          error={query.error}
          onRetry={() => query.refetch()}
          meta={query.data?.meta}
          onPageChange={(p) => set({ page: p })}
          empty={<EmptyState icon={FileSpreadsheet} title="No exports yet" description="Export orders, inventory or customers as CSV. Files are deleted after the retention period." />}
        />
      </Card>
      {canCreate ? <NewReportDialog open={creating} onOpenChange={setCreating} /> : null}
    </>
  );
}

function SchedulesTab({ canManage }: { canManage: boolean }) {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [dialog, setDialog] = React.useState<{ open: boolean; schedule?: ReportSchedule }>({ open: false });
  const [deleting, setDeleting] = React.useState<ReportSchedule | null>(null);
  const query = useQuery({ queryKey: ["report-schedules", page], queryFn: () => reportsApi.listSchedulesEnvelope({ page, limit: 20 }), placeholderData: keepPreviousData });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["report-schedules"] });
  const toggle = useMutation({
    mutationFn: (s: ReportSchedule) => reportsApi.updateSchedule(s.id, { enabled: !s.enabled }),
    onSuccess: (s) => { toast.success(s.enabled ? "Schedule resumed" : "Schedule paused", { description: s.name }); refresh(); },
    onError: (e) => toastError(e, "Couldn't update the schedule"),
  });
  const remove = useMutation({
    mutationFn: (s: ReportSchedule) => reportsApi.deleteSchedule(s.id),
    onSuccess: () => { toast.success("Schedule deleted"); refresh(); },
    onError: (e) => toastError(e, "Couldn't delete the schedule"),
  });

  const columns: Column<ReportSchedule>[] = [
    { key: "name", header: "Schedule", cell: (s) => <div><p className="font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{typeLabel(s.type)} · {humanize(s.frequency)} · {s.recipientUserIds.length} recipient{s.recipientUserIds.length === 1 ? "" : "s"}</p></div> },
    { key: "last", header: "Last run", cell: (s) => <div className="flex flex-col"><span className="text-muted-foreground">{s.lastRunAt ? formatRelative(s.lastRunAt) : "Not yet"}</span>{s.lastPeriod ? <span className="text-xs text-muted-foreground">Covered {s.lastPeriod.replace("week-of-", "week of ")}</span> : null}</div>, headerClassName: "hidden md:table-cell", className: "hidden md:table-cell" },
    { key: "status", header: "Status", cell: (s) => <div className="flex flex-col gap-0.5"><StatusPill status={s.enabled ? "ACTIVE" : "INACTIVE"} label={s.enabled ? "Active" : "Paused"} />{s.lastError ? <span className="max-w-xs text-xs text-destructive">{s.lastError}</span> : null}</div> },
    {
      key: "actions",
      header: "",
      cell: (s) => (
        <RowActions
          actions={[
            { label: "Edit", icon: Pencil, hidden: !canManage, onSelect: () => setDialog({ open: true, schedule: s }) },
            { label: s.enabled ? "Pause" : "Resume", icon: s.enabled ? Pause : Play, hidden: !canManage, onSelect: () => toggle.mutate(s) },
            { label: "Delete", icon: Trash2, destructive: true, hidden: !canManage, onSelect: () => setDeleting(s) },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <Card className="gap-0 py-0">
        <TableToolbar>
          <p className="text-sm text-muted-foreground">Each run covers the period that just ended (UTC). Recipients get a link to the export by email, never the data itself.</p>
          {canManage ? <Button className="sm:ml-auto" onClick={() => setDialog({ open: true })}><Plus /> New schedule</Button> : null}
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={query.data?.data}
          rowKey={(s) => s.id}
          loading={query.isFetching && !query.data}
          error={query.error}
          onRetry={() => query.refetch()}
          meta={query.data?.meta}
          onPageChange={setPage}
          onRowClick={canManage ? (s) => setDialog({ open: true, schedule: s }) : undefined}
          empty={<EmptyState icon={CalendarClock} title="No schedules" description="Get yesterday's orders every morning, or last month's customers on the 1st." />}
        />
      </Card>
      {canManage ? <ScheduleDialog open={dialog.open} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} schedule={dialog.schedule} /> : null}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this schedule?"
        description={`"${deleting?.name}" stops running. Exports it already made stay until retention removes them.`}
        confirmLabel="Delete schedule"
        destructive
        onConfirm={() => (deleting ? remove.mutateAsync(deleting) : undefined)}
      />
    </>
  );
}

/** CSV exports (POST/GET /reports, signed download) and recurring report schedules (/report-schedules). */
export default function ReportsPage() {
  const { get, set } = useUrlState();
  const { hasPermission } = usePermission();
  const allowed = useAllowedReportTypes();
  const canCreate = hasPermission("report:create") && allowed.length > 0;
  const tab = get("tab", "exports");
  return (
    <PageBody>
      <PageHeader title="Reports" description="Download your data as CSV, now or on a schedule." />
      <Tabs value={tab} onValueChange={(t) => set({ tab: t === "exports" ? null : t })} className="gap-4">
        <TabsList>
          <TabsTrigger value="exports"><FileSpreadsheet /> Exports</TabsTrigger>
          <TabsTrigger value="schedules"><CalendarClock /> Schedules</TabsTrigger>
        </TabsList>
        <TabsContent value="exports" className="flex flex-col gap-4">
          <ExportsTab canCreate={canCreate} />
        </TabsContent>
        <TabsContent value="schedules" className="flex flex-col gap-4">
          <SchedulesTab canManage={canCreate} />
        </TabsContent>
      </Tabs>
    </PageBody>
  );
}
