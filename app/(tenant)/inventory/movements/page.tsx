"use client";

import * as React from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, FilterSelect, TableToolbar, ALL, type Column } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { EmptyState } from "@/components/app/states";
import { useVariantLookup, useWarehouseOptions } from "@/features/catalog/lookups";
import { inventoryApi, MOVEMENT_TYPES, type InventoryMovement } from "@/lib/api/modules/inventory";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDateTime, humanize } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPE_TONES: Record<string, "info" | "success" | "warning" | "danger" | "brand" | "neutral"> = {
  ADJUSTMENT: "info",
  TRANSFER: "brand",
  ORDER_RESERVATION: "warning",
  ORDER_RELEASE: "neutral",
  ORDER_FULFILLMENT: "success",
  RETURN: "info",
  DAMAGED: "danger",
  LOST: "danger",
  COUNT: "neutral",
};

export default function MovementsPage() {
  const { get, set, page } = useUrlState();
  const type = get("type", ALL);
  const warehouseId = get("warehouse", ALL);
  const variants = useVariantLookup();
  const warehouses = useWarehouseOptions();

  const query = useQuery({
    queryKey: ["inventory", "movements", { page, type, warehouseId }],
    queryFn: () => inventoryApi.listMovementsEnvelope({ page, limit: 25, type: type === ALL ? undefined : type, warehouseId: warehouseId === ALL ? undefined : warehouseId }),
    placeholderData: keepPreviousData,
  });

  const columns: Column<InventoryMovement>[] = [
    { key: "date", header: "When", cell: (m) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(m.createdAt)}</span> },
    {
      key: "item",
      header: "Item",
      cell: (m) => {
        const info = variants.byId.get(m.productVariantId);
        return (
          <div className="min-w-0">
            <p className="truncate font-medium">{info?.product.name ?? "—"}</p>
            <p className="font-mono text-xs text-muted-foreground">{m.productVariant?.sku}</p>
          </div>
        );
      },
    },
    { key: "type", header: "Type", cell: (m) => <StatusPill tone={TYPE_TONES[m.type] ?? "neutral"} label={humanize(m.type)} /> },
    { key: "warehouse", header: "Warehouse", cell: (m) => <span className="text-muted-foreground">{m.warehouse?.code ?? "—"}</span>, headerClassName: "hidden md:table-cell", className: "hidden md:table-cell" },
    {
      key: "change",
      header: "Change",
      headerClassName: "text-right",
      className: "text-right",
      cell: (m) => (
        <span className={cn("tabular font-semibold", m.quantityChanged > 0 ? "text-success" : "text-destructive")}>
          {m.quantityChanged > 0 ? "+" : ""}
          {m.quantityChanged}
        </span>
      ),
    },
    { key: "level", header: "Level", cell: (m) => <span className="tabular whitespace-nowrap text-muted-foreground">{m.quantityBefore} → {m.quantityAfter}</span>, headerClassName: "hidden text-right sm:table-cell", className: "hidden text-right sm:table-cell" },
    {
      key: "reason",
      header: "Reason",
      headerClassName: "hidden lg:table-cell",
      className: "hidden max-w-56 lg:table-cell",
      cell: (m) =>
        m.referenceType === "ORDER" && m.referenceId ? (
          <Link href={`/orders/${m.referenceId}` as never} className="line-clamp-1 text-primary hover:underline">
            {m.reason || "Order"}
          </Link>
        ) : (
          <span className="line-clamp-1 text-muted-foreground">{m.reason || "—"}</span>
        ),
    },
  ];

  return (
    <PageBody>
      <PageHeader title="Stock movements" description="Every change to inventory — adjustments, transfers and order reservations — with before and after levels." />
      <Card className="gap-0 py-0">
        <TableToolbar>
          <FilterSelect value={type} onChange={(v) => set({ type: v })} allLabel="All movement types" options={MOVEMENT_TYPES.map((t) => ({ value: t, label: humanize(t) }))} className="sm:w-52" />
          <FilterSelect value={warehouseId} onChange={(v) => set({ warehouse: v })} allLabel="All warehouses" options={warehouses.options} className="sm:w-52" />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={query.data?.data}
          rowKey={(m) => m.id}
          loading={query.isFetching}
          error={query.error}
          onRetry={() => query.refetch()}
          meta={query.data?.meta}
          onPageChange={(p) => set({ page: p })}
          empty={<EmptyState icon={History} title="No movements" description="Stock changes will appear here as they happen." />}
        />
      </Card>
    </PageBody>
  );
}
