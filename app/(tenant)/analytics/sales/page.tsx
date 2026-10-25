"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { EmptyState, ErrorState } from "@/components/app/states";
import { RangeToggle, bucketLabel, useAnalyticsRange } from "@/features/analytics/range";
import { analyticsApi } from "@/lib/api/modules/analytics";
import { formatMoney, formatNumber, DEFAULT_CURRENCY } from "@/lib/format";

const config = { sales: { label: "Sales", color: "var(--chart-1)" } } satisfies ChartConfig;

export default function SalesAnalyticsPage() {
  const { params, groupBy, range } = useAnalyticsRange();
  const sales = useQuery({ queryKey: ["analytics", "sales", params], queryFn: () => analyticsApi.getSales({ ...params, limit: 100 }) });
  const rows = sales.data ?? [];
  const totalSales = rows.reduce((s, b) => s + Number(b.totalSales), 0);
  const totalOrders = rows.reduce((s, b) => s + b.orderCount, 0);

  return (
    <PageBody>
      <PageHeader title="Sales" description={`Order volume and value over the last ${range.label}, grouped by ${groupBy}.`} actions={<RangeToggle />} />
      <Card>
        <CardHeader>
          <CardTitle className="tabular text-2xl">{sales.isLoading ? <Skeleton className="h-7 w-32" /> : formatMoney(totalSales)}</CardTitle>
          <CardDescription>{formatNumber(totalOrders)} orders in the period</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {sales.isLoading ? (
            <Skeleton className="h-[320px] w-full" />
          ) : sales.error ? (
            <ErrorState error={sales.error} onRetry={() => sales.refetch()} />
          ) : rows.length ? (
            <ChartContainer config={config} className="aspect-auto h-[320px] w-full">
              <BarChart data={rows.map((b) => ({ bucket: b.bucket, sales: Number(b.totalSales) }))} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={(v) => bucketLabel(v, groupBy)} />
                <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => formatMoney(v, DEFAULT_CURRENCY, { compact: true })} />
                <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent labelFormatter={(v) => bucketLabel(v as string, groupBy, true)} formatter={(v) => <span className="tabular font-medium">{formatMoney(Number(v))}</span>} />} />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState title="No sales in this period" className="h-[320px]" />
          )}
        </CardContent>
      </Card>
      {rows.length ? (
        <Card className="gap-0 py-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5 text-xs uppercase tracking-wide">Period</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wide">Orders</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wide">Avg. order</TableHead>
                <TableHead className="pr-5 text-right text-xs uppercase tracking-wide">Sales</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...rows].reverse().map((b) => (
                <TableRow key={b.bucket ?? "all"}>
                  <TableCell className="pl-5">{bucketLabel(b.bucket, groupBy, true)}</TableCell>
                  <TableCell className="tabular text-right">{formatNumber(b.orderCount)}</TableCell>
                  <TableCell className="tabular text-right text-muted-foreground">{formatMoney(b.avgValue)}</TableCell>
                  <TableCell className="tabular pr-5 text-right font-medium">{formatMoney(b.totalSales)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : null}
    </PageBody>
  );
}
