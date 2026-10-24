"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, SearchInput, TableToolbar, type Column } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { RowActions } from "@/components/app/row-actions";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { FormDialog, Field } from "@/components/app/form-dialog";
import { EmptyState } from "@/components/app/states";
import { Can } from "@/components/auth/can";
import { categoriesApi } from "@/lib/api/modules/categories";
import type { Category } from "@/lib/api/types";
import { usePermission } from "@/lib/auth/permission-context";
import { useUrlState } from "@/hooks/use-url-state";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";

const NO_PARENT = "none";
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const { get, set, page } = useUrlState();
  const search = get("q");
  const [dialog, setDialog] = React.useState<{ open: boolean; category?: Category }>({ open: false });
  const [deleting, setDeleting] = React.useState<Category | null>(null);

  const query = useQuery({
    queryKey: ["categories", { page, search }],
    queryFn: () => categoriesApi.listEnvelope({ page, limit: 20, search: search || undefined }),
    placeholderData: keepPreviousData,
  });
  const all = useQuery({ queryKey: ["categories", "options"], queryFn: () => categoriesApi.listEnvelope({ limit: 100 }) });
  const names = new Map((all.data?.data ?? []).map((c) => [c.id, c.name]));

  const remove = useMutation({
    mutationFn: (c: Category) => categoriesApi.remove(c.id),
    onSuccess: (_, c) => {
      toast.success("Category deleted", { description: c.name });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e) => toastError(e, "Couldn't delete category"),
  });

  const columns: Column<Category>[] = [
    {
      key: "name",
      header: "Category",
      cell: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{c.name}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">/{c.slug}</p>
        </div>
      ),
    },
    { key: "parent", header: "Parent", cell: (c) => <span className="text-muted-foreground">{c.parentId ? names.get(c.parentId) ?? "—" : "Top level"}</span>, headerClassName: "hidden md:table-cell", className: "hidden md:table-cell" },
    { key: "products", header: "Products", cell: (c) => <span className="tabular">{c._count?.productCategories ?? 0}</span> },
    { key: "sub", header: "Subcategories", cell: (c) => <span className="tabular">{c.children?.length ?? 0}</span>, headerClassName: "hidden sm:table-cell", className: "hidden sm:table-cell" },
    { key: "status", header: "Status", cell: (c) => <StatusPill status={c.isActive ? "ACTIVE" : "INACTIVE"} label={c.isActive ? "Visible" : "Hidden"} /> },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-12",
      cell: (c) => (
        <RowActions
          actions={[
            { label: "Edit", icon: Pencil, onSelect: () => setDialog({ open: true, category: c }), hidden: !hasPermission("category:update") },
            { label: "Delete", icon: Trash2, destructive: true, onSelect: () => setDeleting(c), hidden: !hasPermission("category:delete") },
          ]}
        />
      ),
    },
  ];

  return (
    <PageBody>
      <PageHeader
        title="Categories"
        description="Organize products into a browsable hierarchy."
        actions={
          <Can permission="category:create">
            <Button onClick={() => setDialog({ open: true })}>
              <Plus /> Add category
            </Button>
          </Can>
        }
      />
      <Card className="gap-0 py-0">
        <TableToolbar>
          <SearchInput value={search} onChange={(q) => set({ q })} placeholder="Search categories…" />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={query.data?.data}
          rowKey={(c) => c.id}
          loading={query.isFetching}
          error={query.error}
          onRetry={() => query.refetch()}
          meta={query.data?.meta}
          onPageChange={(p) => set({ page: p })}
          empty={<EmptyState icon={FolderTree} title={search ? "No matching categories" : "No categories yet"} description={search ? undefined : "Create categories to group products for browsing and reporting."} />}
        />
      </Card>
      <CategoryDialog open={dialog.open} category={dialog.category} options={all.data?.data ?? []} onOpenChange={(o) => setDialog((s) => ({ ...s, open: o }))} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "category"}?`}
        description="Products stay in your catalog but lose this category. Categories with subcategories can't be deleted."
        confirmLabel="Delete category"
        destructive
        onConfirm={() => remove.mutateAsync(deleting!)}
      />
    </PageBody>
  );
}

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  slug: z.string().trim().min(1, "Slug is required").max(100).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only"),
  description: z.string().trim().max(1000).optional(),
  parentId: z.string(),
  isActive: z.boolean(),
});
type Values = z.infer<typeof schema>;

function CategoryDialog({ open, onOpenChange, category, options }: { open: boolean; onOpenChange: (o: boolean) => void; category?: Category; options: Category[] }) {
  const queryClient = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      parentId: category?.parentId ?? NO_PARENT,
      isActive: category?.isActive ?? true,
    },
  });

  const save = useMutation({
    mutationFn: (v: Values) => {
      const body = { name: v.name, slug: v.slug, description: v.description || undefined, parentId: v.parentId === NO_PARENT ? null : v.parentId, isActive: v.isActive };
      return category ? categoriesApi.update(category.id, body) : categoriesApi.create(body);
    },
    onSuccess: (c) => {
      toast.success(category ? "Category updated" : "Category created", { description: c.name });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onOpenChange(false);
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, ["name", "slug", "description", "parentId"])) toastError(e, "Couldn't save category");
    },
  });

  const { errors } = form.formState;
  const parentOptions = [{ value: NO_PARENT, label: "None (top level)" }, ...options.filter((o) => o.id !== category?.id).map((o) => ({ value: o.id, label: o.name }))];

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={category ? "Edit category" : "New category"}
      submitLabel={category ? "Save changes" : "Create category"}
      pending={save.isPending}
      onSubmit={form.handleSubmit((v) => save.mutate(v))}
    >
      <Field label="Name" htmlFor="c-name" error={errors.name?.message}>
        <Input
          id="c-name"
          autoFocus
          placeholder="Outerwear"
          {...form.register("name", {
            onChange: (e) => {
              // Follow the name until the user edits the slug themselves
              if (!category && !form.getFieldState("slug").isDirty) form.setValue("slug", slugify(e.target.value));
            },
          })}
        />
      </Field>
      <Field label="Slug" htmlFor="c-slug" error={errors.slug?.message} hint="Used in URLs and integrations">
        <Input id="c-slug" className="font-mono" {...form.register("slug")} />
      </Field>
      <Field label="Parent category">
        <Controller control={form.control} name="parentId" render={({ field }) => <Select options={parentOptions} value={field.value} onValueChange={field.onChange} />} />
      </Field>
      <Field label="Description" htmlFor="c-desc" error={errors.description?.message}>
        <Textarea id="c-desc" rows={3} {...form.register("description")} />
      </Field>
      <Controller
        control={form.control}
        name="isActive"
        render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} label="Visible" description="Hidden categories stay assigned but aren't shown to shoppers." />}
      />
    </FormDialog>
  );
}
