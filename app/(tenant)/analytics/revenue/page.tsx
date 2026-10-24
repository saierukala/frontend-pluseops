"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { CreditCard, RotateCcw, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { KpiCard } from "@/components/app/kpi-card";
import { EmptyState, ErrorState } from "@/components/app/states";
import { RangeToggle, bucketLabel, useAnalyticsRange } from "@/features/analytics/range";
import { analyticsApi } from "@/lib/api/modules/analytics";
import { formatMoney, formatNumber } from "@/lib/format";

const config = {
  net: { label: "Net", color: "var(--chart-3)" },
  refunded: { label: "Refunded", color: "var(--chart-5)" },
} satisfies ChartConfig;

export default function RevenueAnalyticsPage() {
  const { params, groupBy, range } = useAnalyticsRange();
  const revenue = useQuery({ queryKey: ["analytics", "revenue", params], queryFn: () => analyticsApi.getRevenue({ ...params, limit: 100 }) });
  const rows = revenue.data ?? [];
  const sum = (k: "grossRevenue" | "totalRefunded" | "netRevenue") => rows.reduce((s, b) => s + Number(b[k]), 0);

  return (
    <PageBody>
      <PageHeader title="Revenue" description={`Collected payments, refunds and net revenue over the last ${range.label}.`} actions={<RangeToggle />} />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Gross collected" icon={Wallet} loading={revenue.isLoading} value={formatMoney(sum("grossRevenue"))} hint={`${formatNumber(rows.reduce((s, b) => s + b.paymentCount, 0))} payments`} />
        <KpiCard label="Refunded" icon={RotateCcw} loading={revenue.isLoading} value={formatMoney(sum("totalRefunded"))} />
        <KpiCard label="Net revenue" icon={CreditCard} tone="success" loading={revenue.isLoading} value={formatMoney(sum("netRevenue"))} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Net vs refunded</CardTitle>
          <CardDescription>Stacked by {groupBy}</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {revenue.isLoading ? (
            <Skeleton className="h-[320px] w-full" />
          ) : revenue.error ? (
            <ErrorState error={revenue.error} onRetry={() => revenue.refetch()} />
          ) : rows.length ? (
            <ChartContainer config={config} className="aspect-auto h-[320px] w-full">
              <BarChart data={rows.map((b) => ({ bucket: b.bucket, net: Number(b.netRevenue), refunded: Number(b.totalRefunded) }))} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={(v) => bucketLabel(v, groupBy)} />
                <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => formatMoney(v, "USD", { compact: true })} />
                <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent labelFormatter={(v) => bucketLabel(v as string, groupBy, true)} />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="net" stackId="r" fill="var(--color-net)" maxBarSize={48} />
                <Bar dataKey="refunded" stackId="r" fill="var(--color-refunded)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState title="No payments in this period" className="h-[320px]" />
          )}
        </CardContent>
      </Card>
      {rows.length ? (
        <Card className="gap-0 py-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5 text-xs uppercase tracking-wide">Period</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wide">Payments</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wide">Gross</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wide">Refunded</TableHead>
                <TableHead className="pr-5 text-right text-xs uppercase tracking-wide">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...rows].reverse().map((b) => (
                <TableRow key={b.bucket ?? "all"}>
                  <TableCell className="pl-5">{bucketLabel(b.bucket, groupBy, true)}</TableCell>
                  <TableCell className="tabular text-right">{formatNumber(b.paymentCount)}</TableCell>
                  <TableCell className="tabular text-right">{formatMoney(b.grossRevenue)}</TableCell>
                  <TableCell className="tabular text-right text-destructive">{Number(b.totalRefunded) ? `−${formatMoney(b.totalRefunded)}` : "—"}</TableCell>
                  <TableCell className="tabular pr-5 text-right font-medium">{formatMoney(b.netRevenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : null}
    </PageBody>
  );
}
