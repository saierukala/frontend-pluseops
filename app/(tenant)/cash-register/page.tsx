"use client";

import * as React from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Banknote, LockKeyhole, ScanBarcode, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, type Column } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { EmptyState } from "@/components/app/states";
import { cashRegistersApi, type CashSession } from "@/lib/api/modules/pos";
import { usePermission } from "@/lib/auth/permission-context";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDateTime, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CashMoveDialog, CloseRegisterDialog, OpenRegisterDialog } from "@/features/pos/register-dialogs";

const MOVEMENT_LABEL: Record<string, string> = { SALE: "Cash sale", REFUND: "Cash refund", CASH_IN: "Cash in", CASH_OUT: "Cash out" };

/** Counters (cash drawers): the open shift with its running totals, cash in/out, closing, and past shifts. */
export default function CashRegisterPage() {
  const { hasPermission } = usePermission();
  const canManage = hasPermission("cash_register:manage");
  const { page, set } = useUrlState();
  const registers = useQuery({ queryKey: ["cash-registers"], queryFn: () => cashRegistersApi.list() });
  const sessions = useQuery({ queryKey: ["cash-registers", "sessions", page], queryFn: () => cashRegistersApi.sessions({ page, limit: 20 }), placeholderData: keepPreviousData });
  const [dialog, setDialog] = React.useState<{ kind: "open" | "move" | "close"; registerId: string } | null>(null);

  const columns: Column<CashSession>[] = [
    { key: "register", header: "Counter", cell: (s) => <span className="font-medium">{s.registerName}</span> },
    { key: "opened", header: "Opened", cell: (s) => <span className="text-muted-foreground">{formatDateTime(s.openedAt)}</span> },
    { key: "closed", header: "Closed", cell: (s) => <span className="text-muted-foreground">{s.closedAt ? formatDateTime(s.closedAt) : "—"}</span>, headerClassName: "hidden md:table-cell", className: "hidden md:table-cell" },
    { key: "sales", header: "Cash sales", cell: (s) => <span className="tabular">{formatMoney(s.totals.cashSales)}</span>, headerClassName: "text-right", className: "text-right" },
    { key: "expected", header: "Expected", cell: (s) => <span className="tabular">{formatMoney(s.expectedCash ?? s.totals.expectedCash)}</span>, headerClassName: "hidden text-right sm:table-cell", className: "hidden text-right sm:table-cell" },
    {
      key: "variance",
      header: "Difference",
      cell: (s) =>
        s.variance === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className={cn("tabular font-medium", Number(s.variance) === 0 ? "text-success" : "text-destructive")}>
            {Number(s.variance) === 0 ? "Matched" : `${Number(s.variance) > 0 ? "+" : "−"}${formatMoney(Math.abs(Number(s.variance)).toFixed(2))}`}
          </span>
        ),
      headerClassName: "text-right",
      className: "text-right",
    },
    { key: "status", header: "Status", cell: (s) => <StatusPill status={s.status === "OPEN" ? "ACTIVE" : "INACTIVE"} label={s.status === "OPEN" ? "Open" : "Closed"} /> },
  ];

  const active = dialog ? registers.data?.find((r) => r.id === dialog.registerId) : undefined;

  return (
    <PageBody>
      <PageHeader
        title="Cash register"
        description="Open each counter with a float, record cash in and out, and close by counting the drawer."
        actions={
          hasPermission("pos:sell") ? (
            <Button asChild>
              <Link href="/pos">
                <ScanBarcode /> Open the counter
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {registers.isLoading ? <Skeleton className="h-48 w-full" /> : null}
        {registers.data?.map((r) => {
          const s = r.openSession;
          return (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Wallet className="size-4" /> {r.name}
                  </span>
                  <StatusPill status={s ? "ACTIVE" : "INACTIVE"} label={s ? "Open" : "Closed"} />
                </CardTitle>
                <CardDescription>{s ? `Opened ${formatDateTime(s.openedAt)}` : "Closed. Open it before taking cash."}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {s ? (
                  <>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <dt className="text-muted-foreground">Opening float</dt>
                      <dd className="tabular text-right">{formatMoney(s.totals.openingFloat)}</dd>
                      <dt className="text-muted-foreground">Cash sales</dt>
                      <dd className="tabular text-right">+{formatMoney(s.totals.cashSales)}</dd>
                      <dt className="text-muted-foreground">Cash in / out</dt>
                      <dd className="tabular text-right">+{formatMoney(s.totals.cashIn)} / −{formatMoney(s.totals.cashOut)}</dd>
                      <dt className="border-t pt-1 font-semibold">In the drawer</dt>
                      <dd className="tabular border-t pt-1 text-right text-lg font-bold">{formatMoney(s.totals.expectedCash)}</dd>
                    </dl>
                    {s.movements.length ? (
                      <ul className="max-h-40 divide-y overflow-y-auto rounded-md border text-sm" aria-label="Cash movements">
                        {[...s.movements].reverse().map((m) => (
                          <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-1.5">
                            <span>
                              {MOVEMENT_LABEL[m.type] ?? m.type}
                              {m.reason ? <span className="text-muted-foreground"> · {m.reason}</span> : null}
                            </span>
                            <span className={cn("tabular", m.type === "CASH_OUT" || m.type === "REFUND" ? "text-destructive" : "")}>
                              {m.type === "CASH_OUT" || m.type === "REFUND" ? "−" : "+"}
                              {formatMoney(m.amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {canManage ? (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => setDialog({ kind: "move", registerId: r.id })}>
                          <Banknote /> Cash in / out
                        </Button>
                        <Button onClick={() => setDialog({ kind: "close", registerId: r.id })}>
                          <LockKeyhole /> Close register
                        </Button>
                      </div>
                    ) : null}
                  </>
                ) : canManage ? (
                  <Button className="w-fit" onClick={() => setDialog({ kind: "open", registerId: r.id })}>
                    <Wallet /> Open register
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Shift history</CardTitle>
        </CardHeader>
        <DataTable
          columns={columns}
          rows={sessions.data?.data}
          rowKey={(s) => s.id}
          loading={sessions.isFetching}
          error={sessions.error}
          onRetry={() => sessions.refetch()}
          meta={sessions.data?.meta}
          onPageChange={(p) => set({ page: p })}
          empty={<EmptyState icon={Wallet} title="No shifts yet" description="Open a register to start the first shift." />}
        />
      </Card>

      {active && dialog?.kind === "open" ? <OpenRegisterDialog open onOpenChange={(o) => !o && setDialog(null)} registerId={active.id} registerName={active.name} /> : null}
      {active?.openSession && dialog?.kind === "move" ? <CashMoveDialog open onOpenChange={(o) => !o && setDialog(null)} session={{ ...active.openSession, registerName: active.name }} /> : null}
      {active?.openSession && dialog?.kind === "close" ? <CloseRegisterDialog open onOpenChange={(o) => !o && setDialog(null)} session={{ ...active.openSession, registerName: active.name }} /> : null}
    </PageBody>
  );
}
