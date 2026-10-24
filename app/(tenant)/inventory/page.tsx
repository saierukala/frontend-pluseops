"use client";

import * as React from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Boxes, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, FilterSelect, SearchInput, TableToolbar, ALL, type Column } from "@/components/app/data-table";
import { RowActions } from "@/components/app/row-actions";
import { EmptyState } from "@/components/app/states";
import { Can } from "@/components/auth/can";
import { AdjustStockDialog, TransferStockDialog } from "@/features/inventory/stock-dialogs";
import { useVariantLookup, useWarehouseOptions } from "@/features/catalog/lookups";
import { inventoryApi, type InventoryRow } from "@/lib/api/modules/inventory";
import { usePermission } from "@/lib/auth/permission-context";
import { useUrlState } from "@/hooks/use-url-state";
import { formatNumber, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

const LOW_STOCK_THRESHOLD = 10;

export default function StockPage() {
  const { hasPermission } = usePermission();
  const { get, set, page } = useUrlState();
  const search = get("q");
  const warehouseId = get("warehouse", ALL);
  const [adjust, setAdjust] = React.useState<{ open: boolean; variantId?: string; warehouseId?: string }>({ open: get("adjust") === "1" });
  const [transfer, setTransfer] = React.useState<{ open: boolean; variantId?: string; warehouseId?: string }>({ open: false });

  const variants = useVariantLookup();
  const warehouses = useWarehouseOptions();
  const query = useQuery({
    queryKey: ["inventory", "list", { page, search, warehouseId }],
    queryFn: () => inventoryApi.listEnvelope({ page, limit: 25, search: search || undefined, warehouseId: warehouseId === ALL ? undefined : warehouseId, sortBy: "sku", sortOrder: "asc" }),
    placeholderData: keepPreviousData,
  });
  const canUpdate = hasPermission("inventory:update");

  const columns: Column<InventoryRow>[] = [
    {
      key: "item",
      header: "Item",
      cell: (r) => {
        const info = variants.byId.get(r.productVariantId);
        return (
          <div className="min-w-0">
            {info ? (
              <Link href={`/products/${info.product.id}` as never} className="truncate font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                {info.product.name}
              </Link>
            ) : (
              <p className="font-medium text-muted-foreground">Unknown product</p>
            )}
            <p className="font-mono text-xs text-muted-foreground">{r.productVariant?.sku}</p>
          </div>
        );
      },
    },
    { key: "warehouse", header: "Warehouse", cell: (r) => <span className="text-muted-foreground">{r.warehouse?.name ?? "—"}</span>, headerClassName: "hidden md:table-cell", className: "hidden md:table-cell" },
    { key: "onhand", header: "On hand", cell: (r) => <span className="tabular">{formatNumber(r.quantity)}</span>, headerClassName: "text-right", className: "text-right" },
    { key: "reserved", header: "Reserved", cell: (r) => <span className="tabular text-muted-foreground">{formatNumber(r.reservedQuantity)}</span>, headerClassName: "hidden text-right sm:table-cell", className: "hidden text-right sm:table-cell" },
    {
      key: "available",
      header: "Available",
      headerClassName: "text-right",
      className: "text-right",
      cell: (r) => {
        const available = r.quantity - r.reservedQuantity;
        return <span className={cn("tabular font-medium", available <= 0 ? "text-destructive" : available <= LOW_STOCK_THRESHOLD && "text-warning")}>{formatNumber(available)}</span>;
      },
    },
    { key: "updated", header: "Updated", cell: (r) => <span className="text-muted-foreground">{formatRelative(r.updatedAt)}</span>, headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell" },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-12",
      cell: (r) => (
        <RowActions
          actions={[
            { label: "Adjust", icon: SlidersHorizontal, onSelect: () => setAdjust({ open: true, variantId: r.productVariantId, warehouseId: r.warehouseId }), hidden: !canUpdate },
            { label: "Transfer", icon: ArrowLeftRight, onSelect: () => setTransfer({ open: true, variantId: r.productVariantId, warehouseId: r.warehouseId }), hidden: !canUpdate || warehouses.options.length < 2 },
          ]}
        />
      ),
    },
  ];

  return (
    <PageBody>
      <PageHeader
        title="Stock levels"
        description="On-hand, reserved and available units for every variant in every warehouse."
        actions={
          <Can permission="inventory:update">
            <Button variant="outline" onClick={() => setTransfer({ open: true })} disabled={warehouses.options.length < 2}>
              <ArrowLeftRight /> Transfer
            </Button>
            <Button onClick={() => setAdjust({ open: true })}>
              <SlidersHorizontal /> Adjust stock
            </Button>
          </Can>
        }
      />
      <Card className="gap-0 py-0">
        <TableToolbar>
          <SearchInput value={search} onChange={(q) => set({ q })} placeholder="Search by SKU…" />
          <FilterSelect value={warehouseId} onChange={(v) => set({ warehouse: v })} allLabel="All warehouses" options={warehouses.options} className="sm:ml-auto sm:w-52" />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={query.data?.data}
          rowKey={(r) => r.id}
          loading={query.isFetching}
          error={query.error}
          onRetry={() => query.refetch()}
          meta={query.data?.meta}
          onPageChange={(p) => set({ page: p })}
          empty={<EmptyState icon={Boxes} title="No stock records" description="Adjust stock for a variant to start tracking it here." />}
        />
      </Card>
      <AdjustStockDialog open={adjust.open} onOpenChange={(o) => { setAdjust((s) => ({ ...s, open: o })); if (!o && get("adjust")) set({ adjust: null }); }} variantId={adjust.variantId} warehouseId={adjust.warehouseId} />
      <TransferStockDialog open={transfer.open} onOpenChange={(o) => setTransfer((s) => ({ ...s, open: o }))} variantId={transfer.variantId} sourceWarehouseId={transfer.warehouseId} />
    </PageBody>
  );
}
