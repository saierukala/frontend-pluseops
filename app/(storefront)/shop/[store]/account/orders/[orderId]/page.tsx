"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, CreditCard, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/app/status-pill";
import { ErrorState } from "@/components/app/states";
import { RequireShopper } from "@/features/storefront/require-shopper";
import { formatShopAddress } from "@/features/storefront/address-form";
import { useShop } from "@/features/storefront/shop-context";
import { useCompletePayment } from "@/features/storefront/use-pay";
import { formatDateTime, humanize } from "@/lib/format";
import { toastError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

const PAYABLE = ["PENDING", "CONFIRMED", "PROCESSING"];

export default function ShopOrderPage() {
  return (
    <RequireShopper>
      <Order />
    </RequireShopper>
  );
}

function Order() {
  const { orderId } = useParams<{ orderId: string }>();
  const placed = useSearchParams().get("placed") === "1";
  const { client, slug, href, money, store } = useShop();
  const order = useQuery({ queryKey: ["shop", slug, "orders", "detail", orderId], queryFn: () => client.getOrder(orderId) });
  const completePayment = useCompletePayment();
  const pay = useMutation({
    mutationFn: async () => completePayment.mutateAsync(await client.payOrder(orderId)),
    onError: (e) => toastError(e, "Couldn't start payment"),
    onSettled: () => order.refetch(),
  });

  if (order.error) return <ErrorState error={order.error} onRetry={() => order.refetch()} />;
  const o = order.data;
  if (!o) return <Skeleton className="h-96 w-full rounded-2xl" />;

  const paid = o.payments.some((p) => p.status === "COMPLETED" || p.status === "PARTIALLY_REFUNDED");
  const pendingPayment = o.payments.find((p) => p.status === "PENDING");
  // Shoppers can pay online only when the shop has Razorpay connected; otherwise the shop settles by hand
  const canPayOnline = store.onlinePayment.enabled && !paid && PAYABLE.includes(o.status);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground" asChild>
        <Link href={href("/account") as never}>
          <ArrowLeft /> Your orders
        </Link>
      </Button>

      {placed ? (
        <div className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
          <div>
            <p className="font-medium">Thanks — your order is in.</p>
            <p className="text-sm text-muted-foreground">{paid ? "Your payment is confirmed." : store.onlinePayment.enabled ? "Complete payment below whenever you're ready." : `${store.name} will be in touch to arrange payment.`}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Order #{o.number}</h1>
          <p className="text-sm text-muted-foreground">Placed {formatDateTime(o.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={o.status} />
          {canPayOnline ? (
            <Button className="rounded-full" loading={pay.isPending} onClick={() => pay.mutate()}>
              <CreditCard /> Pay {money(o.total, o.currency)}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_18rem]">
        <section className="rounded-2xl border">
          <ul className="divide-y">
            {o.items.map((i, idx) => (
              <li key={idx} className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{i.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    {i.variantName && i.variantName !== i.sku ? `${i.variantName} · ` : ""}
                    {i.quantity} × {money(i.unitPrice, o.currency)}
                  </p>
                </div>
                <span className="tabular font-medium">{money(i.lineTotal, o.currency)}</span>
              </li>
            ))}
          </ul>
          <dl className="flex flex-col gap-1.5 border-t p-4 text-sm">
            <Row label="Subtotal" value={money(o.subtotal, o.currency)} />
            {Number(o.discountTotal) ? <Row label="Discounts" value={`−${money(o.discountTotal, o.currency)}`} /> : null}
            {Number(o.taxTotal) ? <Row label="Tax" value={money(o.taxTotal, o.currency)} /> : null}
            <Row label="Shipping" value={Number(o.shippingTotal) ? money(o.shippingTotal, o.currency) : "Free"} />
            <div className="mt-1 flex justify-between border-t pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular">{money(o.total, o.currency)}</dd>
            </div>
          </dl>
        </section>

        <div className="flex flex-col gap-4">
          {o.shippingAddress ? (
            <section className="rounded-2xl border p-4 text-sm">
              <h2 className="mb-2 flex items-center gap-2 font-semibold">
                <MapPin className="size-4" /> Shipping to
              </h2>
              <p className="font-medium">{[o.shippingAddress.firstName, o.shippingAddress.lastName].filter(Boolean).join(" ")}</p>
              <p className="text-muted-foreground">{formatShopAddress(o.shippingAddress)}</p>
            </section>
          ) : null}
          <section className="rounded-2xl border p-4 text-sm">
            <h2 className="mb-3 font-semibold">Progress</h2>
            <ol className="relative flex flex-col gap-4 border-l pl-5">
              {[...o.timeline].reverse().map((t, i) => (
                <li key={`${t.status}-${t.at}`} className="relative">
                  <span className={cn("absolute -left-[25px] top-1 size-2.5 rounded-full ring-4 ring-background", i === 0 ? "bg-primary" : "bg-muted-foreground/40")} aria-hidden />
                  <p className="font-medium">{humanize(t.status)}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(t.at)}</p>
                </li>
              ))}
            </ol>
          </section>
          <section className="rounded-2xl border p-4 text-sm">
            <h2 className="mb-2 font-semibold">Payment</h2>
            {o.payments.length ? (
              <ul className="flex flex-col gap-2">
                {o.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <span className="tabular">{money(p.amount, p.currency)}</span>
                    <StatusPill status={p.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No payment yet.</p>
            )}
            {pendingPayment && !store.onlinePayment.enabled ? <p className="mt-2 text-xs text-muted-foreground">{store.name} will confirm this payment.</p> : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  );
}
