"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Ban, CreditCard, Mail, RotateCcw, UserRound } from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { StatusPill } from "@/components/app/status-pill";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/app/states";
import { UserAvatar } from "@/components/layout/app-sidebar";
import { RecordPaymentDialog, RefundDialog } from "@/features/orders/payment-dialogs";
import { ordersApi, ORDER_CANCELLABLE, ORDER_NEXT_STATUS } from "@/lib/api/modules/orders";
import { paymentsApi, type Payment } from "@/lib/api/modules/payments";
import { usePermission } from "@/lib/auth/permission-context";
import { formatDateTime, formatMoney, formatRelative, fullName, humanize, shortId } from "@/lib/format";
import { toastError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

const NEXT_LABEL: Record<string, string> = {
  CONFIRMED: "Confirm order",
  PROCESSING: "Start processing",
  SHIPPED: "Mark as shipped",
  DELIVERED: "Mark as delivered",
};

const PAYABLE = ["PENDING", "CONFIRMED", "PROCESSING"];

/** Remaining refundable amount in cents, from server decimal strings (display/default only). */
function refundableOf(p: Payment): string {
  const cents = (v: string) => Math.round(Number(v) * 100);
  const refunded = (p.refunds ?? []).filter((r) => r.status !== "FAILED").reduce((sum, r) => sum + cents(r.amount), 0);
  return (Math.max(0, cents(p.amount) - refunded) / 100).toFixed(2);
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();

  const order = useQuery({ queryKey: ["order", id], queryFn: () => ordersApi.getById(id) });
  const history = useQuery({ queryKey: ["order", id, "history"], queryFn: () => ordersApi.getHistory(id, { limit: 50 }) });
  const payments = useQuery({ queryKey: ["order", id, "payments"], queryFn: () => paymentsApi.listEnvelope({ orderId: id, sortOrder: "asc" }), enabled: hasPermission("payment:read") });

  const [advancing, setAdvancing] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const [paying, setPaying] = React.useState(false);
  const [refunding, setRefunding] = React.useState<Payment | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["order", id] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
  };

  const o = order.data;
  const next = o ? ORDER_NEXT_STATUS[o.status] : undefined;
  const advance = useMutation({
    mutationFn: () => ordersApi.updateStatus(id, { status: next! }),
    onSuccess: (updated) => {
      toast.success(`Order ${humanize(updated.status).toLowerCase()}`);
      invalidate();
    },
    onError: (e) => toastError(e, "Couldn't update status"),
  });
  const cancel = useMutation({
    mutationFn: () => ordersApi.cancel(id, { reason: cancelReason || undefined }),
    onSuccess: () => {
      toast.success("Order cancelled", { description: "Reserved stock was released." });
      setCancelReason("");
      invalidate();
    },
    onError: (e) => toastError(e, "Couldn't cancel order"),
  });

  if (order.error) {
    return (
      <Card>
        <ErrorState error={order.error} onRetry={() => order.refetch()} />
      </Card>
    );
  }

  const paymentList = payments.data?.data ?? [];
  const completed = paymentList.find((p) => p.status === "COMPLETED" || p.status === "PARTIALLY_REFUNDED");
  const pending = paymentList.find((p) => p.status === "PENDING" || p.status === "PROCESSING");
  const canPay = o && PAYABLE.includes(o.status) && !completed && hasPermission("payment:create") && hasPermission("payment:confirm");

  return (
    <PageBody>
      <Button variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground" asChild>
        <Link href={"/orders" as never}>
          <ArrowLeft /> Orders
        </Link>
      </Button>
      <PageHeader
        title={o ? <span className="font-mono">#{shortId(o.id)}</span> : <Skeleton className="h-8 w-40" />}
        description={o ? <span className="flex flex-wrap items-center gap-2"><StatusPill status={o.status} /> Placed {formatDateTime(o.createdAt)}</span> : null}
        actions={
          o ? (
            <>
              {ORDER_CANCELLABLE.includes(o.status) && hasPermission("order:cancel") ? (
                <Button variant="outline" onClick={() => setCancelling(true)}>
                  <Ban /> Cancel order
                </Button>
              ) : null}
              {canPay ? (
                <Button variant="outline" onClick={() => setPaying(true)}>
                  <CreditCard /> {pending ? "Confirm payment" : "Record payment"}
                </Button>
              ) : null}
              {next && hasPermission("order:update") ? (
                <Button onClick={() => setAdvancing(true)}>
                  {NEXT_LABEL[next]} <ArrowRight />
                </Button>
              ) : null}
            </>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="gap-0 pb-0">
            <CardHeader className="border-b pb-4">
              <CardTitle>Items</CardTitle>
              <CardDescription>Prices are snapshots taken when the order was placed.</CardDescription>
            </CardHeader>
            {o ? (
              <>
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6 text-xs uppercase tracking-wide">Item</TableHead>
                      <TableHead className="text-right text-xs uppercase tracking-wide">Qty</TableHead>
                      <TableHead className="hidden text-right text-xs uppercase tracking-wide sm:table-cell">Unit price</TableHead>
                      <TableHead className="pr-6 text-right text-xs uppercase tracking-wide">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {o.items?.map((item) => (
                      <TableRow key={item.id} className="hover:bg-transparent">
                        <TableCell className="py-3 pl-6">
                          <p className="font-medium">{item.productNameSnapshot}</p>
                          <p className="font-mono text-xs text-muted-foreground">{item.skuSnapshot}</p>
                        </TableCell>
                        <TableCell className="tabular text-right">{item.quantity}</TableCell>
                        <TableCell className="tabular hidden text-right text-muted-foreground sm:table-cell">{formatMoney(item.unitPrice, o.currency)}</TableCell>
                        <TableCell className="tabular pr-6 text-right font-medium">{formatMoney(item.lineTotal, o.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <dl className="ml-auto flex w-full max-w-xs flex-col gap-2 border-t px-6 py-4 text-sm">
                  <SummaryRow label="Subtotal" value={formatMoney(o.subtotal, o.currency)} />
                  {Number(o.discountTotal) ? <SummaryRow label="Discounts" value={`−${formatMoney(o.discountTotal, o.currency)}`} /> : null}
                  {Number(o.taxTotal) ? <SummaryRow label="Tax" value={formatMoney(o.taxTotal, o.currency)} /> : null}
                  <SummaryRow label="Shipping" value={formatMoney(o.shippingTotal, o.currency)} />
                  <div className="mt-1 flex items-center justify-between border-t pt-3 text-base font-semibold">
                    <dt>Total</dt>
                    <dd className="tabular">{formatMoney(o.total, o.currency)}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <div className="space-y-3 p-6">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            )}
          </Card>

          {hasPermission("payment:read") ? (
            <Card className="gap-0 pb-0">
              <CardHeader className="border-b pb-4">
                <CardTitle>Payments</CardTitle>
                <CardDescription>Charges and refunds for this order.</CardDescription>
                {canPay ? (
                  <CardAction>
                    <Button size="sm" onClick={() => setPaying(true)}>
                      <CreditCard /> {pending ? "Confirm payment" : "Record payment"}
                    </Button>
                  </CardAction>
                ) : null}
              </CardHeader>
              {payments.isLoading ? (
                <div className="p-6">
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : paymentList.length ? (
                <ul className="divide-y">
                  {paymentList.map((p) => {
                    const refundable = refundableOf(p);
                    return (
                      <li key={p.id} className="flex flex-col gap-2 px-6 py-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
                            <CreditCard className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="tabular font-medium">{formatMoney(p.amount, p.currency)}</p>
                            <p className="text-xs text-muted-foreground">
                              {humanize(p.provider ?? "manual")} · {formatRelative(p.createdAt)}
                            </p>
                          </div>
                          <StatusPill status={p.status} />
                          {(p.status === "COMPLETED" || p.status === "PARTIALLY_REFUNDED") && Number(refundable) > 0 && hasPermission("payment:refund") ? (
                            <Button size="sm" variant="outline" onClick={() => setRefunding(p)}>
                              <RotateCcw /> Refund
                            </Button>
                          ) : null}
                        </div>
                        {p.refunds?.length ? (
                          <ul className="ml-12 flex flex-col gap-1 border-l pl-4 text-sm">
                            {p.refunds.map((r) => (
                              <li key={r.id} className="flex items-center justify-between text-muted-foreground">
                                <span>Refund · {formatRelative(r.createdAt)}</span>
                                <span className="tabular text-destructive">−{formatMoney(r.amount, p.currency)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState icon={CreditCard} title="No payments yet" description={canPay ? "Record a payment once the customer has paid." : undefined} className="py-10" />
              )}
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              {o?.customer ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar first={o.customer.firstName} last={o.customer.lastName} className="size-10 rounded-full" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{fullName(o.customer)}</p>
                      <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                        <Mail className="size-3.5" /> {o.customer.email}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/orders?customer=${o.customer.id}` as never}>
                      <UserRound /> View their orders
                    </Link>
                  </Button>
                </div>
              ) : (
                <Skeleton className="h-10 w-full" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {history.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <ol className="relative flex flex-col gap-5 border-l pl-5">
                  {[...(history.data ?? [])].reverse().map((h, i) => (
                    <li key={h.id} className="relative">
                      <span className={cn("absolute -left-[25px] top-1 size-2.5 rounded-full border-2 border-background ring-1 ring-border", i === 0 ? "bg-primary" : "bg-muted-foreground/40")} aria-hidden />
                      <p className="text-sm font-medium">{h.fromStatus ? `${humanize(h.fromStatus)} → ${humanize(h.toStatus)}` : `Order ${humanize(h.toStatus).toLowerCase()}`}</p>
                      {h.reason ? <p className="text-sm text-muted-foreground">{h.reason}</p> : null}
                      <p className="text-xs text-muted-foreground">{formatDateTime(h.createdAt)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {o ? <RecordPaymentDialog open={paying} onOpenChange={setPaying} order={o} pending={pending} /> : null}
      {refunding ? <RefundDialog open onOpenChange={(v) => !v && setRefunding(null)} payment={refunding} refundable={refundableOf(refunding)} /> : null}
      <ConfirmDialog open={advancing} onOpenChange={setAdvancing} title={next ? `${NEXT_LABEL[next]}?` : ""} description={next ? `The order moves from ${humanize(o?.status)} to ${humanize(next)}.` : undefined} confirmLabel={next ? NEXT_LABEL[next] : "Continue"} onConfirm={() => advance.mutateAsync()} />
      <ConfirmDialog open={cancelling} onOpenChange={setCancelling} title="Cancel this order?" description="Reserved stock is released back to inventory. This can't be undone." confirmLabel="Cancel order" destructive onConfirm={() => cancel.mutateAsync()}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cancel-reason">Reason (optional)</Label>
          <Textarea id="cancel-reason" rows={2} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Customer request, payment issue…" />
        </div>
      </ConfirmDialog>
    </PageBody>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd className="tabular text-foreground">{value}</dd>
    </div>
  );
}
