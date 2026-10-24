"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, subDays } from "date-fns";
import { AlertTriangle, ArrowUpRight, Boxes, CreditCard, Package, Plus, ShoppingCart } from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { KpiCard } from "@/components/app/kpi-card";
import { StatusPill } from "@/components/app/status-pill";
import { EmptyState, ErrorState } from "@/components/app/states";
import { Can } from "@/components/auth/can";
import { dashboardApi, isSectionError } from "@/lib/api/modules/dashboard";
import { analyticsApi } from "@/lib/api/modules/analytics";
import { ordersApi } from "@/lib/api/modules/orders";
import { useAuth } from "@/lib/auth/auth-context";
import { usePermission } from "@/lib/auth/permission-context";
import { formatMoney, formatNumber, formatRelative, fullName, humanize, shortId } from "@/lib/format";

const RANGE_DAYS = 30;
const ORDER_FLOW = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const chartConfig = {
  sales: { label: "Sales", color: "var(--chart-1)" },
} satisfies ChartConfig;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  const overview = useQuery({ queryKey: ["dashboard", "overview"], queryFn: dashboardApi.getOverview, enabled: hasPermission("dashboard:read") });
  const from = format(subDays(new Date(), RANGE_DAYS - 1), "yyyy-MM-dd");
  const sales = useQuery({
    queryKey: ["analytics", "sales", "daily", from],
    queryFn: () => analyticsApi.getSales({ from, groupBy: "day", limit: 100 }),
    enabled: hasPermission("analytics:read"),
  });
  const recentOrders = useQuery({
    queryKey: ["orders", "recent"],
    queryFn: () => ordersApi.listEnvelope({ limit: 6 }),
    enabled: hasPermission("order:read"),
  });

  const data = overview.data;
  const orders = data && !isSectionError(data.orders) ? data.orders : undefined;
  const inventory = data && !isSectionError(data.inventory) ? data.inventory : undefined;
  const payments = data && !isSectionError(data.payments) ? data.payments : undefined;
  const products = data && !isSectionError(data.products) ? data.products : undefined;
  const loading = overview.isLoading;

  // Fill days without sales with zero so the trend reads as a continuous line
  const series = React.useMemo(() => {
    const byDay = new Map((sales.data ?? []).filter((b) => b.bucket).map((b) => [b.bucket!.slice(0, 10), Number(b.totalSales)]));
    return Array.from({ length: RANGE_DAYS }, (_, i) => {
      const day = format(subDays(new Date(), RANGE_DAYS - 1 - i), "yyyy-MM-dd");
      return { day, sales: byDay.get(day) ?? 0 };
    });
  }, [sales.data]);
  const rangeTotal = (sales.data ?? []).reduce((sum, b) => sum + Number(b.totalSales), 0);
  const pending = orders?.byStatus.PENDING ?? 0;

  return (
    <PageBody>
      <PageHeader
        eyebrow={format(new Date(), "EEEE, MMMM d")}
        title={`${greeting()}, ${user?.firstName ?? "there"}`}
        description="Here's what's happening across your store today."
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

      {overview.error ? <Card><ErrorState error={overview.error} onRetry={() => overview.refetch()} /></Card> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Collected revenue" icon={CreditCard} loading={loading} value={formatMoney(payments?.completedRevenue)} hint={`${formatNumber(payments?.byStatus.COMPLETED ?? 0)} completed payments`} />
        <KpiCard label="Orders" icon={ShoppingCart} loading={loading} value={formatNumber(orders?.total)} hint={pending ? `${pending} awaiting confirmation` : "Nothing waiting on you"} />
        <KpiCard label="Catalog" icon={Package} loading={loading} value={formatNumber(products?.products)} hint={`${formatNumber(products?.variants ?? 0)} variants in ${formatNumber(products?.categories ?? 0)} categories`} />
        <KpiCard
          label="Low stock"
          icon={inventory?.lowStockItems ? AlertTriangle : Boxes}
          tone={inventory?.lowStockItems ? "warning" : "default"}
          loading={loading}
          value={formatNumber(inventory?.lowStockItems)}
          hint={<Link href={"/inventory/low-stock" as never} className="hover:text-foreground hover:underline">{formatNumber(inventory?.totalQuantity ?? 0)} units across {inventory?.warehouses ?? 0} warehouses</Link>}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales</CardTitle>
            <CardDescription>Order value over the last {RANGE_DAYS} days</CardDescription>
            <CardAction className="text-right">
              <div className="tabular text-xl font-semibold">{sales.isLoading ? <Skeleton className="h-6 w-24" /> : formatMoney(rangeTotal)}</div>
            </CardAction>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {sales.isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : sales.error ? (
              <ErrorState error={sales.error} onRetry={() => sales.refetch()} />
            ) : (
              <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
                <AreaChart data={series} margin={{ left: 4, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} tickFormatter={(v: string) => format(new Date(`${v}T00:00:00`), "MMM d")} />
                  <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => formatMoney(v, "USD", { compact: true })} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" labelFormatter={(v) => format(new Date(`${v}T00:00:00`), "EEE, MMM d")} formatter={(value) => <span className="tabular font-medium">{formatMoney(Number(value))}</span>} />}
                  />
                  <Area dataKey="sales" type="monotone" fill="url(#fillSales)" stroke="var(--color-sales)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order pipeline</CardTitle>
            <CardDescription>Where your {formatNumber(orders?.total ?? 0)} orders are now</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3.5">
            {loading
              ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-7 w-full" />)
              : ORDER_FLOW.map((status) => {
                  const count = orders?.byStatus[status] ?? 0;
                  const pct = orders?.total ? Math.round((count / orders.total) * 100) : 0;
                  return (
                    <Link key={status} href={`/orders?status=${status}` as never} className="group flex flex-col gap-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground group-hover:text-foreground">{humanize(status)}</span>
                        <span className="tabular font-medium">{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary/80 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
                  );
                })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-0 pb-0 lg:col-span-2">
          <CardHeader className="border-b pb-4">
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Latest activity from your customers</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href={"/orders" as never}>
                  View all <ArrowUpRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          {recentOrders.isLoading ? (
            <div className="space-y-3 p-6">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : recentOrders.data?.data.length ? (
            <ul className="divide-y">
              {recentOrders.data.data.map((o) => (
                <li key={o.id}>
                  <Link href={`/orders/${o.id}` as never} className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{fullName(o.customer)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        #{shortId(o.id)} · {o.items?.length ?? 0} item{o.items?.length === 1 ? "" : "s"} · {formatRelative(o.createdAt)}
                      </p>
                    </div>
                    <StatusPill status={o.status} className="hidden sm:inline-flex" />
                    <span className="tabular w-24 text-right text-sm font-medium">{formatMoney(o.total, o.currency)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={ShoppingCart} title="No orders yet" description="Orders you create or receive will show up here." />
          )}
        </Card>

        <Card className="gap-0 pb-0">
          <CardHeader className="border-b pb-4">
            <CardTitle>Recent payments</CardTitle>
            <CardDescription>Latest money movement</CardDescription>
          </CardHeader>
          {loading ? (
            <div className="space-y-3 p-6">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : payments?.recent.length ? (
            <ul className="divide-y">
              {payments.recent.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link href={`/orders/${p.orderId}` as never} className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/50">
                    <span className="flex size-8 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
                      <CreditCard className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="tabular text-sm font-medium">{formatMoney(p.amount, p.currency)}</p>
                      <p className="text-xs text-muted-foreground">{formatRelative(p.createdAt)}</p>
                    </div>
                    <StatusPill status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={CreditCard} title="No payments yet" />
          )}
        </Card>
      </div>
    </PageBody>
  );
}
