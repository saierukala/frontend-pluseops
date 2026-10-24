"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { FormDialog, Field } from "@/components/app/form-dialog";
import { ALL } from "@/components/app/data-table";
import {
  reportsApi,
  REPORT_DATA_PERMISSION,
  REPORT_FILTERS,
  type ReportFilters,
  type ReportFrequency,
  type ReportSchedule,
  type ReportType,
} from "@/lib/api/modules/reports";
import { warehousesApi } from "@/lib/api/modules/warehouses";
import { usersApi } from "@/lib/api/modules/users";
import { ORDER_STATUSES } from "@/lib/api/modules/orders";
import { usePermission } from "@/lib/auth/permission-context";
import { useAuth } from "@/lib/auth/auth-context";
import { toastError } from "@/lib/api-errors";
import { fullName, humanize } from "@/lib/format";

export const REPORT_TYPES: Array<{ value: ReportType; label: string; description: string }> = [
  { value: "ORDERS", label: "Orders", description: "One row per order with customer, totals and status" },
  { value: "INVENTORY", label: "Inventory", description: "Stock per variant and warehouse" },
  { value: "CUSTOMERS", label: "Customers", description: "Customers with order count and amount spent" },
];

/** Report types this user may export: report:create plus read access to that data. */
export function useAllowedReportTypes() {
  const { hasPermission } = usePermission();
  return REPORT_TYPES.filter((t) => hasPermission(REPORT_DATA_PERMISSION[t.value]));
}

function FilterFields({ type, filters, onChange, withDates }: { type: ReportType; filters: ReportFilters; onChange: (f: ReportFilters) => void; withDates: boolean }) {
  const accepts = REPORT_FILTERS[type];
  const warehouses = useQuery({ queryKey: ["warehouses", "options"], queryFn: () => warehousesApi.list({ limit: 100 }), enabled: accepts.includes("warehouseId") });
  return (
    <>
      {withDates && accepts.includes("from") ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From" htmlFor="rep-from" hint="UTC day, inclusive">
            <Input id="rep-from" type="date" value={filters.from ?? ""} max={filters.to || undefined} onChange={(e) => onChange({ ...filters, from: e.target.value || undefined })} />
          </Field>
          <Field label="To" htmlFor="rep-to">
            <Input id="rep-to" type="date" value={filters.to ?? ""} min={filters.from || undefined} onChange={(e) => onChange({ ...filters, to: e.target.value || undefined })} />
          </Field>
        </div>
      ) : null}
      {accepts.includes("status") ? (
        <Field label="Order status">
          <Select value={filters.status ?? ALL} onValueChange={(v) => onChange({ ...filters, status: v === ALL ? undefined : v })} options={[{ value: ALL, label: "Any status" }, ...ORDER_STATUSES.map((s) => ({ value: s, label: humanize(s) }))]} />
        </Field>
      ) : null}
      {accepts.includes("warehouseId") ? (
        <Field label="Warehouse">
          <Select value={filters.warehouseId ?? ALL} onValueChange={(v) => onChange({ ...filters, warehouseId: v === ALL ? undefined : v })} options={[{ value: ALL, label: "All warehouses" }, ...(warehouses.data ?? []).map((w) => ({ value: w.id, label: w.name }))]} />
        </Field>
      ) : null}
    </>
  );
}

export function NewReportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const types = useAllowedReportTypes();
  const [type, setType] = React.useState<ReportType>(types[0]?.value ?? "ORDERS");
  const [filters, setFilters] = React.useState<ReportFilters>({});
  const request = useMutation({
    mutationFn: () => reportsApi.request({ type, filters: Object.fromEntries(Object.entries(filters).filter(([k, v]) => v && REPORT_FILTERS[type].includes(k as keyof ReportFilters))) }),
    onSuccess: () => {
      toast.success("Export started", { description: "It appears in the list when it's ready to download." });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setFilters({});
      onOpenChange(false);
    },
    onError: (e) => toastError(e, "Couldn't start the export"),
  });
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="New CSV export" description="Built in the background; large exports take a moment." submitLabel="Start export" pending={request.isPending} onSubmit={(e) => { e.preventDefault(); request.mutate(); }}>
      <Field label="Data" hint={types.find((t) => t.value === type)?.description}>
        <Select value={type} onValueChange={(v) => { setType(v as ReportType); setFilters({}); }} options={types.map((t) => ({ value: t.value, label: t.label }))} />
      </Field>
      <FilterFields type={type} filters={filters} onChange={setFilters} withDates />
    </FormDialog>
  );
}

const FREQUENCIES: Array<{ value: ReportFrequency; label: string; hint: string }> = [
  { value: "DAILY", label: "Daily", hint: "Yesterday, sent shortly after midnight UTC" },
  { value: "WEEKLY", label: "Weekly", hint: "Last Monday–Sunday, sent on Mondays" },
  { value: "MONTHLY", label: "Monthly", hint: "Last calendar month, sent on the 1st" },
];

export function ScheduleDialog({ open, onOpenChange, schedule }: { open: boolean; onOpenChange: (o: boolean) => void; schedule?: ReportSchedule }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const types = useAllowedReportTypes();
  const users = useQuery({ queryKey: ["users", "options"], queryFn: () => usersApi.list({ limit: 100 }), enabled: open });
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<ReportType>("ORDERS");
  const [frequency, setFrequency] = React.useState<ReportFrequency>("DAILY");
  const [filters, setFilters] = React.useState<ReportFilters>({});
  const [recipients, setRecipients] = React.useState<string[]>([]);
  const [enabled, setEnabled] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(schedule?.name ?? "");
    setType(schedule?.type ?? types[0]?.value ?? "ORDERS");
    setFrequency(schedule?.frequency ?? "DAILY");
    setFilters(schedule?.filters ?? {});
    setRecipients(schedule?.recipientUserIds ?? (user?.id ? [user.id] : []));
    setEnabled(schedule?.enabled ?? true);
  }, [open, schedule, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: () => {
      const fixed = Object.fromEntries(Object.entries(filters).filter(([k, v]) => v && (k === "status" || k === "warehouseId") && REPORT_FILTERS[type].includes(k as keyof ReportFilters)));
      const body = { name: name.trim(), frequency, filters: fixed, recipientUserIds: recipients, enabled };
      return schedule ? reportsApi.updateSchedule(schedule.id, body) : reportsApi.createSchedule({ ...body, type });
    },
    onSuccess: (s) => {
      toast.success(schedule ? "Schedule saved" : "Schedule created", { description: s.name });
      queryClient.invalidateQueries({ queryKey: ["report-schedules"] });
      onOpenChange(false);
    },
    onError: (e) => toastError(e, "Couldn't save the schedule"),
  });

  const toggleRecipient = (id: string, on: boolean) => setRecipients((r) => (on ? [...new Set([...r, id])] : r.filter((x) => x !== id)));

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={schedule ? "Edit report schedule" : "Schedule a report"}
      description="Each period's report is built automatically and the recipients get a link to it by email."
      submitLabel={schedule ? "Save changes" : "Create schedule"}
      pending={save.isPending}
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Give the schedule a name");
        if (!recipients.length) return toast.error("Pick at least one recipient");
        save.mutate();
      }}
    >
      <Field label="Name" htmlFor="sch-name">
        <Input id="sch-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Daily orders" maxLength={120} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data" hint={schedule ? "Can't change after creation" : undefined}>
          <Select value={type} disabled={!!schedule} onValueChange={(v) => { setType(v as ReportType); setFilters({}); }} options={REPORT_TYPES.filter((t) => schedule || types.some((x) => x.value === t.value)).map((t) => ({ value: t.value, label: t.label }))} />
        </Field>
        <Field label="Every" hint={FREQUENCIES.find((f) => f.value === frequency)?.hint}>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as ReportFrequency)} options={FREQUENCIES.map((f) => ({ value: f.value, label: f.label }))} />
        </Field>
      </div>
      <FilterFields type={type} filters={filters} onChange={setFilters} withDates={false} />
      <Field label="Email the link to" hint="Active members of this workspace">
        <div className="flex max-h-48 flex-col gap-2 overflow-y-auto rounded-lg border p-3">
          {(users.data ?? []).filter((u) => u.status === "ACTIVE").map((u) => (
            <Checkbox key={u.id} checked={recipients.includes(u.id)} onCheckedChange={(c) => toggleRecipient(u.id, c === true)} label={`${fullName(u)} · ${u.email}`} />
          ))}
        </div>
      </Field>
      <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
        <span>
          <span className="font-medium">Active</span>
          <span className="block text-xs text-muted-foreground">Paused schedules don&apos;t catch up on missed periods.</span>
        </span>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </label>
    </FormDialog>
  );
}
