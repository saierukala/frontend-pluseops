"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, FilterSelect, SearchInput, TableToolbar, ALL, type Column } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { RowActions } from "@/components/app/row-actions";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { EmptyState } from "@/components/app/states";
import { Can } from "@/components/auth/can";
import { ProductFormDialog, PRODUCT_STATUS_OPTIONS } from "@/features/catalog/product-form-dialog";
import { productsApi } from "@/lib/api/modules/products";
import { categoriesApi } from "@/lib/api/modules/categories";
import type { Product } from "@/lib/api/types";
import { usePermission } from "@/lib/auth/permission-context";
import { useUrlState } from "@/hooks/use-url-state";
import { formatMoney, formatRelative } from "@/lib/format";
import { toastError } from "@/lib/api-errors";

export default function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const { get, set, page } = useUrlState();
  const search = get("q");
  const status = get("status", ALL);
  const categoryId = get("category", ALL);

  const [editing, setEditing] = React.useState<Product | null>(null);
  const [creating, setCreating] = React.useState(get("new") === "1");
  const [deleting, setDeleting] = React.useState<Product | null>(null);

  const query = useQuery({
    queryKey: ["products", { page, search, status, categoryId }],
    queryFn: () =>
      productsApi.listEnvelope({
        page,
        limit: 20,
        search: search || undefined,
        status: status === ALL ? undefined : status,
        categoryId: categoryId === ALL ? undefined : categoryId,
      }),
    placeholderData: keepPreviousData,
  });
  const categories = useQuery({ queryKey: ["categories", "options"], queryFn: () => categoriesApi.listEnvelope({ limit: 100 }) });

  const remove = useMutation({
    mutationFn: (p: Product) => productsApi.remove(p.id),
    onSuccess: (_, p) => {
      toast.success("Product deleted", { description: p.name });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toastError(e, "Couldn't delete product"),
  });

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Product",
      cell: (p) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
            <Package className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{p.name}</p>
            <p className="truncate text-xs text-muted-foreground">{p.brand || "No brand"}</p>
          </div>
        </div>
      ),
    },
    { key: "category", header: "Category", cell: (p) => <span className="text-muted-foreground">{p.categories?.find((c) => c.isPrimary)?.category.name ?? p.categories?.[0]?.category.name ?? "—"}</span>, headerClassName: "hidden md:table-cell", className: "hidden md:table-cell" },
    { key: "variants", header: "Variants", cell: (p) => <span className="tabular">{p._count?.variants ?? p.variants?.length ?? 0}</span>, headerClassName: "hidden sm:table-cell", className: "hidden sm:table-cell" },
    { key: "price", header: "Base price", cell: (p) => <span className="tabular">{formatMoney(p.basePrice)}</span> },
    { key: "status", header: "Status", cell: (p) => <StatusPill status={p.status} /> },
    { key: "updated", header: "Updated", cell: (p) => <span className="text-muted-foreground">{formatRelative(p.updatedAt)}</span>, headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell" },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-12",
      cell: (p) => (
        <RowActions
          actions={[
            { label: "Edit", icon: Pencil, onSelect: () => setEditing(p), hidden: !hasPermission("product:update") },
            { label: "Delete", icon: Trash2, destructive: true, onSelect: () => setDeleting(p), hidden: !hasPermission("product:delete") },
          ]}
        />
      ),
    },
  ];

  const filtered = Boolean(search || status !== ALL || categoryId !== ALL);

  return (
    <PageBody>
      <PageHeader
        title="Products"
        description="Your catalog. Each product has one or more variants (SKUs) that carry price and stock."
        actions={
          <Can permission="product:create">
            <Button onClick={() => setCreating(true)}>
              <Plus /> Add product
            </Button>
          </Can>
        }
      />
      <Card className="gap-0 py-0">
        <TableToolbar>
          <SearchInput value={search} onChange={(q) => set({ q })} placeholder="Search products…" />
          <div className="flex gap-2 sm:ml-auto">
            <FilterSelect value={categoryId} onChange={(v) => set({ category: v })} allLabel="All categories" options={(categories.data?.data ?? []).map((c) => ({ value: c.id, label: c.name }))} />
            <FilterSelect value={status} onChange={(v) => set({ status: v })} allLabel="All statuses" options={PRODUCT_STATUS_OPTIONS} className="sm:w-36" />
          </div>
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={query.data?.data}
          rowKey={(p) => p.id}
          loading={query.isFetching}
          error={query.error}
          onRetry={() => query.refetch()}
          meta={query.data?.meta}
          onPageChange={(p) => set({ page: p })}
          onRowClick={(p) => router.push(`/products/${p.id}` as never)}
          empty={
            filtered ? (
              <EmptyState icon={Package} title="No matching products" description="Try a different search or clear the filters." action={<Button variant="outline" size="sm" onClick={() => set({ q: null, status: null, category: null })}>Clear filters</Button>} />
            ) : (
              <EmptyState icon={Package} title="No products yet" description="Add your first product to start selling." action={hasPermission("product:create") ? <Button size="sm" onClick={() => setCreating(true)}><Plus /> Add product</Button> : undefined} />
            )
          }
        />
      </Card>

      <ProductFormDialog open={creating} onOpenChange={(o) => { setCreating(o); if (!o && get("new")) set({ new: null }); }} />
      <ProductFormDialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)} product={editing ?? undefined} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "product"}?`}
        description="The product and its variants are removed from the catalog. Existing orders keep their snapshot."
        confirmLabel="Delete product"
        destructive
        onConfirm={() => remove.mutateAsync(deleting!)}
      />
    </PageBody>
  );
}
