"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Pencil, Plus, Trash2, Warehouse as WarehouseIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, SearchInput, TableToolbar, type Column } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { RowActions } from "@/components/app/row-actions";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { FormDialog, Field } from "@/components/app/form-dialog";
import { EmptyState } from "@/components/app/states";
import { Can } from "@/components/auth/can";
import { warehousesApi } from "@/lib/api/modules/warehouses";
import type { Warehouse } from "@/lib/api/types";
import { usePermission } from "@/lib/auth/permission-context";
import { useUrlState } from "@/hooks/use-url-state";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";

export default function WarehousesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const { get, set, page } = useUrlState();
  const search = get("q");
  const [dialog, setDialog] = React.useState<{ open: boolean; warehouse?: Warehouse }>({ open: false });
  const [deleting, setDeleting] = React.useState<Warehouse | null>(null);

  const query = useQuery({
    queryKey: ["warehouses", { page, search }],
    queryFn: () => warehousesApi.listEnvelope({ page, limit: 20, search: search || undefined }),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (w: Warehouse) => warehousesApi.remove(w.id),
    onSuccess: (_, w) => {
      toast.success("Warehouse deleted", { description: w.name });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
    onError: (e) => toastError(e, "Couldn't delete warehouse"),
  });

  const columns: Column<Warehouse>[] = [
    {
      key: "name",
      header: "Warehouse",
      cell: (w) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
            <WarehouseIcon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-medium">
              {w.name}
              {w.isDefault ? <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">DEFAULT</span> : null}
            </p>
            <p className="font-mono text-xs text-muted-foreground">{w.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (w) => {
        const place = [w.city, w.state, w.country].filter(Boolean).join(", ");
        return place ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-3.5" /> {place}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
      headerClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
    },
    { key: "status", header: "Status", cell: (w) => <StatusPill status={w.isActive ? "ACTIVE" : "INACTIVE"} /> },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-12",
      cell: (w) => (
        <RowActions
          actions={[
            { label: "Edit", icon: Pencil, onSelect: () => setDialog({ open: true, warehouse: w }), hidden: !hasPermission("warehouse:update") },
            { label: "Delete", icon: Trash2, destructive: true, onSelect: () => setDeleting(w), hidden: !hasPermission("warehouse:delete") },
          ]}
        />
      ),
    },
  ];

  return (
    <PageBody>
      <PageHeader
        title="Warehouses"
        description="Locations that hold stock. Orders reserve inventory from a specific warehouse."
        actions={
          <Can permission="warehouse:create">
            <Button onClick={() => setDialog({ open: true })}>
              <Plus /> Add warehouse
            </Button>
          </Can>
        }
      />
      <Card className="gap-0 py-0">
        <TableToolbar>
          <SearchInput value={search} onChange={(q) => set({ q })} placeholder="Search by name, code or city…" />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={query.data?.data}
          rowKey={(w) => w.id}
          loading={query.isFetching}
          error={query.error}
          onRetry={() => query.refetch()}
          meta={query.data?.meta}
          onPageChange={(p) => set({ page: p })}
          empty={<EmptyState icon={WarehouseIcon} title={search ? "No matching warehouses" : "No warehouses yet"} description={search ? undefined : "Add a warehouse before stocking products."} />}
        />
      </Card>
      <WarehouseDialog open={dialog.open} warehouse={dialog.warehouse} onOpenChange={(o) => setDialog((s) => ({ ...s, open: o }))} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "warehouse"}?`}
        description="Stock records for this location are no longer available for new orders."
        confirmLabel="Delete warehouse"
        destructive
        onConfirm={() => remove.mutateAsync(deleting!)}
      />
    </PageBody>
  );
}

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  code: z.string().trim().min(1, "Code is required").max(50).regex(/^[A-Z0-9_-]+$/, "Uppercase letters, numbers, - and _"),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  isActive: z.boolean(),
  isDefault: z.boolean(),
});
type Values = z.infer<typeof schema>;
const FIELDS = Object.keys(schema.shape);

function WarehouseDialog({ open, onOpenChange, warehouse }: { open: boolean; onOpenChange: (o: boolean) => void; warehouse?: Warehouse }) {
  const queryClient = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: warehouse?.name ?? "",
      code: warehouse?.code ?? "",
      address: warehouse?.address ?? "",
      city: warehouse?.city ?? "",
      state: warehouse?.state ?? "",
      country: warehouse?.country ?? "",
      postalCode: warehouse?.postalCode ?? "",
      isActive: warehouse?.isActive ?? true,
      isDefault: warehouse?.isDefault ?? false,
    },
  });

  const save = useMutation({
    mutationFn: (v: Values) => {
      const optional = (s?: string) => s || undefined;
      const body = { name: v.name, address: optional(v.address), city: optional(v.city), state: optional(v.state), country: optional(v.country), postalCode: optional(v.postalCode), isActive: v.isActive, isDefault: v.isDefault };
      // The code is the warehouse's stable identifier and can't change after creation
      return warehouse ? warehousesApi.update(warehouse.id, body) : warehousesApi.create({ ...body, code: v.code });
    },
    onSuccess: (w) => {
      toast.success(warehouse ? "Warehouse updated" : "Warehouse created", { description: w.name });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      onOpenChange(false);
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, FIELDS)) toastError(e, "Couldn't save warehouse");
    },
  });

  const { errors } = form.formState;
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={warehouse ? "Edit warehouse" : "New warehouse"} submitLabel={warehouse ? "Save changes" : "Create warehouse"} pending={save.isPending} onSubmit={form.handleSubmit((v) => save.mutate(v))}>
      <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
        <Field label="Name" htmlFor="w-name" error={errors.name?.message}>
          <Input id="w-name" autoFocus placeholder="Main Warehouse" {...form.register("name")} />
        </Field>
        <Field label="Code" htmlFor="w-code" error={errors.code?.message}>
          <Input id="w-code" className="font-mono uppercase" placeholder="MAIN" disabled={Boolean(warehouse)} {...form.register("code", { setValueAs: (v: string) => v.toUpperCase() })} />
        </Field>
      </div>
      <Field label="Street address" htmlFor="w-addr" error={errors.address?.message}>
        <Input id="w-addr" {...form.register("address")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" htmlFor="w-city">
          <Input id="w-city" {...form.register("city")} />
        </Field>
        <Field label="State / region" htmlFor="w-state">
          <Input id="w-state" {...form.register("state")} />
        </Field>
        <Field label="Country" htmlFor="w-country">
          <Input id="w-country" {...form.register("country")} />
        </Field>
        <Field label="Postal code" htmlFor="w-zip">
          <Input id="w-zip" {...form.register("postalCode")} />
        </Field>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <Controller control={form.control} name="isActive" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} label="Active" description="Inactive warehouses can't receive new reservations." />} />
        <Controller control={form.control} name="isDefault" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} label="Default warehouse" description="Pre-selected when creating orders and adjusting stock." />} />
      </div>
    </FormDialog>
  );
}
