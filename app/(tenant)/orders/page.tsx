"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, TableToolbar, type Column } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { EmptyState } from "@/components/app/states";
import { Can } from "@/components/auth/can";
import { ordersApi, type Order } from "@/lib/api/modules/orders";
import { dashboardApi, isSectionError } from "@/lib/api/modules/dashboard";
import { usePermission } from "@/lib/auth/permission-context";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDateTime, formatMoney, fullName, humanize, shortId } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABS = ["all", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function OrdersPage() {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const { get, set, page } = useUrlState();
  const status = get("status", "all");
  const customerId = get("customer");

  const query = useQuery({
    queryKey: ["orders", { page, status, customerId }],
    queryFn: () => ordersApi.listEnvelope({ page, limit: 20, status: status === "all" ? undefined : status, customerId: customerId || undefined }),
    placeholderData: keepPreviousData,
  });
  // Tab counts come from the cached dashboard aggregate (one request, TTL 60s)
  const overview = useQuery({ queryKey: ["dashboard", "overview"], queryFn: dashboardApi.getOverview, enabled: hasPermission("dashboard:read") });
  const counts = overview.data && !isSectionError(overview.data.orders) ? overview.data.orders : undefined;

  const columns: Column<Order>[] = [
    { key: "id", header: "Order", cell: (o) => <span className="font-mono text-[13px] font-medium">#{shortId(o.id)}</span>, headerClassName: "hidden sm:table-cell", className: "hidden sm:table-cell" },
    {
      key: "customer",
      header: "Customer",
      cell: (o) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{fullName(o.customer)}</p>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">{o.customer?.email}</p>
          {/* Phones drop the Order column, so the number moves under the name */}
          <p className="font-mono text-xs text-muted-foreground sm:hidden">#{shortId(o.id)}</p>
        </div>
      ),
    },
    { key: "items", header: "Items", cell: (o) => <span className="tabular text-muted-foreground">{o.items?.reduce((n, i) => n + i.quantity, 0) ?? "—"}</span>, headerClassName: "hidden md:table-cell", className: "hidden md:table-cell" },
    { key: "status", header: "Status", cell: (o) => <StatusPill status={o.status} /> },
    { key: "date", header: "Placed", cell: (o) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(o.createdAt)}</span>, headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell" },
    { key: "total", header: "Total", cell: (o) => <span className="tabular font-medium">{formatMoney(o.total, o.currency)}</span>, headerClassName: "text-right", className: "text-right" },
  ];

  return (
    <PageBody>
      <PageHeader
        title="Orders"
        description="Track every order from placement to delivery."
        actions={
          <Can permission="order:create">
            <Button asChild>
              <Link href={"/orders/new" as never}>
                <Plus /> Create order
              </Link>
            </Button>
          </Can>
        }
      />
      <Card className="gap-0 py-0">
        <TableToolbar className="py-2">
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1" role="tablist" aria-label="Filter by status">
            {TABS.map((tab) => {
              const count = tab === "all" ? counts?.total : counts?.byStatus[tab];
              const active = status === tab;
              return (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={active}
                  onClick={() => set({ status: tab })}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {tab === "all" ? "All" : humanize(tab)}
                  {count !== undefined ? <span className={cn("tabular rounded px-1 text-xs", active ? "bg-primary/15" : "bg-muted")}>{count}</span> : null}
                </button>
              );
            })}
          </div>
          {customerId ? (
            <Button variant="outline" size="sm" className="sm:ml-auto" onClick={() => set({ customer: null })}>
              Customer filter ✕
            </Button>
          ) : null}
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={query.data?.data}
          rowKey={(o) => o.id}
          loading={query.isFetching}
          error={query.error}
          onRetry={() => query.refetch()}
          meta={query.data?.meta}
          onPageChange={(p) => set({ page: p })}
          onRowClick={(o) => router.push(`/orders/${o.id}` as never)}
          empty={
            <EmptyState
              icon={ShoppingCart}
              title={status === "all" ? "No orders yet" : `No ${humanize(status).toLowerCase()} orders`}
              description={status === "all" ? "Create your first order to see it here." : undefined}
              action={status === "all" && hasPermission("order:create") ? <Button size="sm" asChild><Link href={"/orders/new" as never}><Plus /> Create order</Link></Button> : undefined}
            />
          }
        />
      </Card>
    </PageBody>
  );
}
