"use client";

import * as React from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, FilterSelect, TableToolbar, ALL, type Column } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/states";
import { AdjustStockDialog } from "@/features/inventory/stock-dialogs";
import { useVariantLookup, useWarehouseOptions } from "@/features/catalog/lookups";
import { inventoryApi, type InventoryRow } from "@/lib/api/modules/inventory";
import { usePermission } from "@/lib/auth/permission-context";
import { useUrlState } from "@/hooks/use-url-state";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function LowStockPage() {
  const { hasPermission } = usePermission();
  const { get, set, page } = useUrlState();
  const threshold = Math.max(0, Number(get("threshold", "10")) || 0);
  const warehouseId = get("warehouse", ALL);
  const [restock, setRestock] = React.useState<{ open: boolean; variantId?: string; warehouseId?: string }>({ open: false });
  const variants = useVariantLookup();
  const warehouses = useWarehouseOptions();

  const query = useQuery({
    queryKey: ["inventory", "low-stock", { page, threshold, warehouseId }],
    queryFn: () => inventoryApi.lowStockEnvelope({ page, limit: 25, threshold, warehouseId: warehouseId === ALL ? undefined : warehouseId }),
    placeholderData: keepPreviousData,
  });

  const columns: Column<InventoryRow>[] = [
    {
      key: "item",
      header: "Item",
      cell: (r) => {
        const info = variants.byId.get(r.productVariantId);
        return (
          <div className="min-w-0">
            {info ? (
              <Link href={`/products/${info.product.id}` as never} className="truncate font-medium hover:underline">
                {info.product.name}
              </Link>
            ) : (
              <p className="font-medium">—</p>
            )}
            <p className="font-mono text-xs text-muted-foreground">{r.productVariant?.sku}</p>
          </div>
        );
      },
    },
    { key: "warehouse", header: "Warehouse", cell: (r) => <span className="text-muted-foreground">{r.warehouse?.name ?? "—"}</span> },
    {
      key: "level",
      header: "On hand",
      cell: (r) => {
        const pct = threshold ? Math.min(100, Math.round((r.quantity / threshold) * 100)) : 0;
        return (
          <div className="flex min-w-36 items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", r.quantity === 0 ? "bg-destructive" : "bg-warning")} style={{ width: `${Math.max(pct, 4)}%` }} />
            </div>
            <span className={cn("tabular w-8 text-right font-semibold", r.quantity === 0 ? "text-destructive" : "text-warning")}>{formatNumber(r.quantity)}</span>
          </div>
        );
      },
    },
    {
      key: "action",
      header: <span className="sr-only">Restock</span>,
      className: "w-28 text-right",
      cell: (r) =>
        hasPermission("inventory:update") ? (
          <Button size="sm" variant="outline" onClick={() => setRestock({ open: true, variantId: r.productVariantId, warehouseId: r.warehouseId })}>
            <Plus /> Restock
          </Button>
        ) : null,
    },
  ];

  return (
    <PageBody>
      <PageHeader title="Low stock" description="Items at or below your reorder threshold, lowest first." />
      <Card className="gap-0 py-0">
        <TableToolbar>
          <div className="flex items-center gap-2">
            <Label htmlFor="threshold" className="whitespace-nowrap text-sm text-muted-foreground">
              Threshold
            </Label>
            <Input id="threshold" type="number" min={0} className="w-24 tabular" defaultValue={threshold} onBlur={(e) => set({ threshold: e.target.value || "10" })} onKeyDown={(e) => e.key === "Enter" && set({ threshold: (e.target as HTMLInputElement).value || "10" })} />
            <span className="text-sm text-muted-foreground">units</span>
          </div>
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
          empty={<EmptyState icon={CheckCircle2} title="Everything is well stocked" description={`No items at or below ${threshold} units.`} />}
        />
      </Card>
      <AdjustStockDialog open={restock.open} onOpenChange={(o) => setRestock((s) => ({ ...s, open: o }))} variantId={restock.variantId} warehouseId={restock.warehouseId} />
    </PageBody>
  );
}
