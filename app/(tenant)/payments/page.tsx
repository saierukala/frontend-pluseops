"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CreditCard, RotateCcw, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, FilterSelect, TableToolbar, ALL, type Column } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { KpiCard } from "@/components/app/kpi-card";
import { EmptyState } from "@/components/app/states";
import { paymentsApi, type Payment } from "@/lib/api/modules/payments";
import { analyticsApi } from "@/lib/api/modules/analytics";
import { usePermission } from "@/lib/auth/permission-context";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDateTime, formatMoney, fullName, humanize, shortId } from "@/lib/format";

const STATUSES = ["COMPLETED", "PENDING", "PARTIALLY_REFUNDED", "REFUNDED", "FAILED", "CANCELLED"];

export default function PaymentsPage() {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const { get, set, page } = useUrlState();
  const status = get("status", ALL);

  const query = useQuery({
    queryKey: ["payments", { page, status }],
    queryFn: () => paymentsApi.listEnvelope({ page, limit: 20, status: status === ALL ? undefined : status }),
    placeholderData: keepPreviousData,
  });
  const overview = useQuery({ queryKey: ["analytics", "overview"], queryFn: () => analyticsApi.getOverview(), enabled: hasPermission("analytics:read") });
  const revenue = overview.data?.revenue;

  const columns: Column<Payment>[] = [
    {
      key: "payment",
      header: "Payment",
      cell: (p) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
            <CreditCard className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="tabular font-medium">{formatMoney(p.amount, p.currency)}</p>
            <p className="text-xs text-muted-foreground">{humanize(p.provider ?? "manual")}</p>
          </div>
        </div>
      ),
    },
    { key: "customer", header: "Customer", cell: (p) => <span className="truncate">{fullName(p.order?.customer)}</span>, headerClassName: "hidden md:table-cell", className: "hidden md:table-cell" },
    { key: "order", header: "Order", cell: (p) => <span className="font-mono text-[13px] text-muted-foreground">#{shortId(p.orderId)}</span> },
    {
      key: "refunded",
      header: "Refunded",
      headerClassName: "hidden text-right sm:table-cell",
      className: "hidden text-right sm:table-cell",
      cell: (p) => {
        const total = (p.refunds ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
        return total ? <span className="tabular text-destructive">−{formatMoney(total, p.currency)}</span> : <span className="text-muted-foreground">—</span>;
      },
    },
    { key: "status", header: "Status", cell: (p) => <StatusPill status={p.status} /> },
    { key: "date", header: "Date", cell: (p) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(p.createdAt)}</span>, headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell" },
  ];

  return (
    <PageBody>
      <PageHeader title="Payments" description="Every charge and refund across your orders. Open a payment's order to refund it." />
      {hasPermission("analytics:read") ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Gross collected" icon={Wallet} loading={overview.isLoading} value={formatMoney(revenue?.completedRevenue)} hint={`${revenue?.totalPayments ?? 0} payments`} />
          <KpiCard label="Refunded" icon={RotateCcw} loading={overview.isLoading} value={formatMoney(revenue?.totalRefunded)} />
          <KpiCard label="Net revenue" icon={CreditCard} tone="success" loading={overview.isLoading} value={formatMoney(revenue?.netRevenue)} />
        </div>
      ) : null}
      <Card className="gap-0 py-0">
        <TableToolbar>
          <FilterSelect value={status} onChange={(v) => set({ status: v })} allLabel="All statuses" options={STATUSES.map((s) => ({ value: s, label: humanize(s) }))} />
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
          onRowClick={(p) => router.push(`/orders/${p.orderId}` as never)}
          empty={<EmptyState icon={CreditCard} title="No payments" description="Payments recorded on orders show up here." />}
        />
      </Card>
    </PageBody>
  );
}
