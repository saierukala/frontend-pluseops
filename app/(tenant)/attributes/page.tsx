"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ListPlus, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, SearchInput, TableToolbar, type Column } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { RowActions } from "@/components/app/row-actions";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { FormDialog, Field } from "@/components/app/form-dialog";
import { EmptyState } from "@/components/app/states";
import { Can } from "@/components/auth/can";
import { attributesApi, type AttributeDefinition } from "@/lib/api/modules/attributes";
import { usePermission } from "@/lib/auth/permission-context";
import { useUrlState } from "@/hooks/use-url-state";
import { humanize } from "@/lib/format";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";

const DATA_TYPES = [
  { value: "OPTION", label: "Option list (e.g. Size: S, M, L)" },
  { value: "TEXT", label: "Free text" },
  { value: "NUMBER", label: "Number" },
  { value: "BOOLEAN", label: "Yes / No" },
];

export default function AttributesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const { get, set, page } = useUrlState();
  const search = get("q");
  const [dialog, setDialog] = React.useState<{ open: boolean; attribute?: AttributeDefinition }>({ open: false });
  const [deleting, setDeleting] = React.useState<AttributeDefinition | null>(null);
  const [valuesFor, setValuesFor] = React.useState<AttributeDefinition | null>(null);

  const query = useQuery({
    queryKey: ["attributes", { page, search }],
    queryFn: () => attributesApi.listEnvelope({ page, limit: 20, search: search || undefined }),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (a: AttributeDefinition) => attributesApi.remove(a.id),
    onSuccess: (_, a) => {
      toast.success("Attribute deleted", { description: a.name });
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
    },
    onError: (e) => toastError(e, "Couldn't delete attribute"),
  });

  const columns: Column<AttributeDefinition>[] = [
    {
      key: "name",
      header: "Attribute",
      cell: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{a.name}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{a.code}</p>
        </div>
      ),
    },
    { key: "type", header: "Type", cell: (a) => <StatusPill tone="brand" label={humanize(a.dataType)} /> },
    { key: "required", header: "Required", cell: (a) => <span className="text-muted-foreground">{a.isRequired ? "Required" : "Optional"}</span>, headerClassName: "hidden sm:table-cell", className: "hidden sm:table-cell" },
    { key: "desc", header: "Description", cell: (a) => <span className="line-clamp-1 text-muted-foreground">{a.description || "—"}</span>, headerClassName: "hidden lg:table-cell", className: "hidden max-w-xs lg:table-cell" },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-12",
      cell: (a) => (
        <RowActions
          actions={[
            { label: "Manage values", icon: ListPlus, onSelect: () => setValuesFor(a), hidden: a.dataType !== "OPTION" },
            { label: "Edit", icon: Pencil, onSelect: () => setDialog({ open: true, attribute: a }), hidden: !hasPermission("attribute:update") },
            { label: "Delete", icon: Trash2, destructive: true, onSelect: () => setDeleting(a), hidden: !hasPermission("attribute:delete") },
          ]}
        />
      ),
    },
  ];

  return (
    <PageBody>
      <PageHeader
        title="Attributes"
        description="Reusable properties like size, color or material that describe your variants."
        actions={
          <Can permission="attribute:create">
            <Button onClick={() => setDialog({ open: true })}>
              <Plus /> Add attribute
            </Button>
          </Can>
        }
      />
      <Card className="gap-0 py-0">
        <TableToolbar>
          <SearchInput value={search} onChange={(q) => set({ q })} placeholder="Search attributes…" />
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
          onRowClick={(a) => a.dataType === "OPTION" && setValuesFor(a)}
          empty={
            <EmptyState
              icon={Tags}
              title={search ? "No matching attributes" : "No attributes yet"}
              description={search ? undefined : "Define attributes such as Size or Color, then assign values to variants."}
              action={!search && hasPermission("attribute:create") ? <Button size="sm" onClick={() => setDialog({ open: true })}><Plus /> Add attribute</Button> : undefined}
            />
          }
        />
      </Card>

      <AttributeDialog open={dialog.open} attribute={dialog.attribute} onOpenChange={(o) => setDialog((s) => ({ ...s, open: o }))} onCreated={(a) => a.dataType === "OPTION" && setValuesFor(a)} />
      <ValuesSheet attribute={valuesFor} onOpenChange={(o) => !o && setValuesFor(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "attribute"}?`}
        description="Attributes that are in use by variants can't be deleted."
        confirmLabel="Delete attribute"
        destructive
        onConfirm={() => remove.mutateAsync(deleting!)}
      />
    </PageBody>
  );
}

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  code: z.string().trim().min(1, "Code is required").max(100).regex(/^[a-z0-9_-]+$/, "Lowercase letters, numbers, - and _"),
  dataType: z.enum(["TEXT", "NUMBER", "BOOLEAN", "OPTION"]),
  isRequired: z.boolean(),
  description: z.string().trim().max(1000).optional(),
});
type Values = z.infer<typeof schema>;

function AttributeDialog({ open, onOpenChange, attribute, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; attribute?: AttributeDefinition; onCreated: (a: AttributeDefinition) => void }) {
  const queryClient = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: { name: attribute?.name ?? "", code: attribute?.code ?? "", dataType: attribute?.dataType ?? "OPTION", isRequired: attribute?.isRequired ?? false, description: attribute?.description ?? "" },
  });
  const save = useMutation({
    mutationFn: (v: Values) => {
      const body = { ...v, description: v.description || undefined };
      return attribute ? attributesApi.update(attribute.id, body) : attributesApi.create(body);
    },
    onSuccess: (a) => {
      toast.success(attribute ? "Attribute updated" : "Attribute created", { description: a.name });
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
      onOpenChange(false);
      if (!attribute) onCreated(a);
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, Object.keys(schema.shape))) toastError(e, "Couldn't save attribute");
    },
  });
  const { errors } = form.formState;

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={attribute ? "Edit attribute" : "New attribute"} submitLabel={attribute ? "Save changes" : "Create attribute"} pending={save.isPending} onSubmit={form.handleSubmit((v) => save.mutate(v))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="a-name" error={errors.name?.message}>
          <Input
            id="a-name"
            autoFocus
            placeholder="Size"
            {...form.register("name", { onChange: (e) => !attribute && form.setValue("code", e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")) })}
          />
        </Field>
        <Field label="Code" htmlFor="a-code" error={errors.code?.message}>
          <Input id="a-code" className="font-mono" placeholder="size" {...form.register("code")} />
        </Field>
      </div>
      <Field label="Type" error={errors.dataType?.message}>
        <Controller control={form.control} name="dataType" render={({ field }) => <Select options={DATA_TYPES} value={field.value} onValueChange={field.onChange} />} />
      </Field>
      <Field label="Description" htmlFor="a-desc">
        <Textarea id="a-desc" rows={2} {...form.register("description")} />
      </Field>
      <Controller control={form.control} name="isRequired" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} label="Required" description="Every variant must provide a value." />} />
    </FormDialog>
  );
}

function ValuesSheet({ attribute, onOpenChange }: { attribute: AttributeDefinition | null; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const [draft, setDraft] = React.useState("");
  const values = useQuery({ queryKey: ["attributes", attribute?.id, "values"], queryFn: () => attributesApi.listValues(attribute!.id), enabled: Boolean(attribute) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["attributes", attribute?.id, "values"] });

  const add = useMutation({
    mutationFn: (label: string) =>
      attributesApi.createValue(attribute!.id, { value: label.toLowerCase().replace(/\s+/g, "-"), displayName: label, sortOrder: values.data?.length ?? 0 }),
    onSuccess: () => {
      setDraft("");
      invalidate();
    },
    onError: (e) => toastError(e, "Couldn't add value"),
  });
  const remove = useMutation({
    mutationFn: (valueId: string) => attributesApi.removeValue(attribute!.id, valueId),
    onSuccess: invalidate,
    onError: (e) => toastError(e, "Couldn't remove value"),
  });

  return (
    <Sheet open={Boolean(attribute)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{attribute?.name} values</SheetTitle>
          <SheetDescription>The options shoppers and staff can pick for this attribute.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          {hasPermission("attribute:create") ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim()) add.mutate(draft.trim());
              }}
            >
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a value, e.g. Large" aria-label="New value" className="flex-1" />
              <Button type="submit" loading={add.isPending} disabled={!draft.trim()}>
                Add
              </Button>
            </form>
          ) : null}
          {values.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : values.data?.length ? (
            <ul className="divide-y rounded-lg border">
              {values.data.map((v) => (
                <li key={v.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="flex-1 text-sm font-medium">{v.displayName}</span>
                  <span className="font-mono text-xs text-muted-foreground">{v.value}</span>
                  {hasPermission("attribute:delete") ? (
                    <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label={`Remove ${v.displayName}`} onClick={() => remove.mutate(v.id)}>
                      <X />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={ListPlus} title="No values yet" className="rounded-lg border border-dashed py-10" />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
