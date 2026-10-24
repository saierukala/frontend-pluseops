"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { DollarSign, Receipt, ShoppingBag, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { KpiCard } from "@/components/app/kpi-card";
import { EmptyState, ErrorState } from "@/components/app/states";
import { RangeToggle, bucketLabel, useAnalyticsRange } from "@/features/analytics/range";
import { analyticsApi } from "@/lib/api/modules/analytics";
import { formatMoney, formatNumber, humanize } from "@/lib/format";

const salesConfig = { sales: { label: "Sales", color: "var(--chart-1)" } } satisfies ChartConfig;
const statusConfig = { count: { label: "Orders", color: "var(--chart-2)" } } satisfies ChartConfig;

export default function AnalyticsOverviewPage() {
  const { params, groupBy, range } = useAnalyticsRange();
  const overview = useQuery({ queryKey: ["analytics", "overview", params], queryFn: () => analyticsApi.getOverview(params) });
  const sales = useQuery({ queryKey: ["analytics", "sales", params], queryFn: () => analyticsApi.getSales({ ...params, limit: 100 }) });
  const byStatus = useQuery({ queryKey: ["analytics", "orders", params], queryFn: () => analyticsApi.getOrders(params) });
  const customers = useQuery({ queryKey: ["analytics", "customers", params], queryFn: () => analyticsApi.getCustomers({ ...params, limit: 5 }) });

  const o = overview.data;
  const series = (sales.data ?? []).map((b) => ({ bucket: b.bucket, sales: Number(b.totalSales), orders: b.orderCount }));

  return (
    <PageBody>
      <PageHeader title="Analytics" description={`Performance over the last ${range.label}.`} actions={<RangeToggle />} />
      {overview.error ? <Card><ErrorState error={overview.error} onRetry={() => overview.refetch()} /></Card> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Sales" icon={DollarSign} loading={overview.isLoading} value={formatMoney(o?.sales.totalSales)} hint={`${formatNumber(o?.sales.totalOrders)} orders`} />
        <KpiCard label="Average order" icon={Receipt} loading={overview.isLoading} value={formatMoney(o?.sales.avgOrderValue)} />
        <KpiCard label="Net revenue" icon={ShoppingBag} tone="success" loading={overview.isLoading} value={formatMoney(o?.revenue.netRevenue)} hint={`${formatMoney(o?.revenue.totalRefunded)} refunded`} />
        <KpiCard label="Customers" icon={Users} loading={overview.isLoading} value={formatNumber(o?.customers.total)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales trend</CardTitle>
            <CardDescription>Order value by {groupBy}</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {sales.isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : series.length ? (
              <ChartContainer config={salesConfig} className="aspect-auto h-[280px] w-full">
                <AreaChart data={series} margin={{ left: 4, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="analyticsSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={(v) => bucketLabel(v, groupBy)} />
                  <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => formatMoney(v, "USD", { compact: true })} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" labelFormatter={(v) => bucketLabel(v as string, groupBy, true)} formatter={(v) => <span className="tabular font-medium">{formatMoney(Number(v))}</span>} />} />
                  <Area dataKey="sales" type="monotone" fill="url(#analyticsSales)" stroke="var(--color-sales)" strokeWidth={2} dot={series.length < 3} />
                </AreaChart>
              </ChartContainer>
            ) : (
              <EmptyState title="No sales in this period" className="h-[280px]" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
            <CardDescription>Placed in this period</CardDescription>
          </CardHeader>
          <CardContent>
            {byStatus.isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : byStatus.data?.length ? (
              <ChartContainer config={statusConfig} className="aspect-auto h-[280px] w-full">
                <BarChart data={byStatus.data.map((s) => ({ status: humanize(s.status), count: s.count }))} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="status" tickLine={false} axisLine={false} width={92} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={6} />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyState title="No orders in this period" className="h-[280px]" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 pb-0">
        <CardHeader className="border-b pb-4">
          <CardTitle>Top customers</CardTitle>
          <CardDescription>By total spend in this period</CardDescription>
        </CardHeader>
        {customers.isLoading ? (
          <div className="space-y-3 p-6">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : customers.data?.length ? (
          <ol className="divide-y">
            {customers.data.map((c, i) => {
              const max = Number(customers.data[0].totalSpent) || 1;
              return (
                <li key={c.customerId} className="flex items-center gap-4 px-6 py-3">
                  <span className="tabular w-5 text-sm text-muted-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.firstName} {c.lastName}</p>
                    <div className="mt-1.5 h-1.5 max-w-md overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-chart-3" style={{ width: `${(Number(c.totalSpent) / max) * 100}%` }} />
                    </div>
                  </div>
                  <Link href={`/orders?customer=${c.customerId}` as never} className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">
                    {c.orderCount} orders
                  </Link>
                  <span className="tabular w-24 text-right text-sm font-semibold">{formatMoney(c.totalSpent)}</span>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState icon={Users} title="No customer purchases in this period" />
        )}
      </Card>
    </PageBody>
  );
}
