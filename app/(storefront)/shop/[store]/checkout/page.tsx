"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Lock, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireShopper } from "@/features/storefront/require-shopper";
import { ShopAddressForm, formatShopAddress } from "@/features/storefront/address-form";
import { useCart, useCartTotals, useShop } from "@/features/storefront/shop-context";
import { gstLabel } from "@/features/orders/gst";
import { useCompletePayment } from "@/features/storefront/use-pay";
import { errorMessage } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

export default function CheckoutPage() {
  return (
    <RequireShopper>
      <Checkout />
    </RequireShopper>
  );
}

function Checkout() {
  const { client, slug, href, money, store } = useShop();
  const router = useRouter();
  const queryClient = useQueryClient();
  const cart = useCart();
  const totals = useCartTotals(cart.data);
  const addresses = useQuery({ queryKey: ["shop", slug, "addresses"], queryFn: () => client.listAddresses() });
  const shipping = (addresses.data ?? []).filter((a) => a.type === "SHIPPING");

  const [selected, setSelected] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const shippingId = selected ?? (shipping.find((a) => a.isDefault) ?? shipping[0])?.id ?? null;
  const completePayment = useCompletePayment();

  const place = useMutation({
    mutationFn: () => client.checkout({ shippingAddressId: shippingId ?? undefined }),
    onSuccess: async ({ order, payment }) => {
      queryClient.invalidateQueries({ queryKey: ["shop", slug, "cart"] });
      queryClient.invalidateQueries({ queryKey: ["shop", slug, "orders"] });
      // Payment problems shouldn't hide the placed order; the order page offers "Pay now" again
      if (payment) await completePayment.mutateAsync(payment).catch(() => undefined);
      router.replace(`${href(`/account/orders/${order.id}`)}?placed=1` as never);
    },
    onError: (e) => setError(errorMessage(e, "Couldn't place your order")),
  });

  if (place.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <Check className="size-8 text-success" />
        <p className="text-lg font-medium">Order placed</p>
        <p className="text-sm text-muted-foreground">Opening your order…</p>
      </div>
    );
  }

  if (cart.data && !cart.data.items.length && !place.isPending) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-lg font-medium">Your cart is empty</p>
        <Button asChild className="rounded-full">
          <Link href={href() as never}>Continue shopping</Link>
        </Button>
      </div>
    );
  }

  const c = cart.data;
  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground" asChild>
        <Link href={href("/cart") as never}>
          <ArrowLeft /> Back to cart
        </Link>
      </Button>
      <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <section className="flex flex-col gap-4 rounded-2xl border p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <MapPin className="size-4" /> Shipping address
            </h2>
            {!adding && shipping.length ? (
              <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
                <Plus /> New address
              </Button>
            ) : null}
          </div>
          {addresses.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : adding || !shipping.length ? (
            <ShopAddressForm
              onSaved={(a) => {
                setSelected(a.id);
                setAdding(false);
              }}
              onCancel={shipping.length ? () => setAdding(false) : undefined}
            />
          ) : (
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Shipping address">
              {shipping.map((a) => {
                const active = a.id === shippingId;
                return (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelected(a.id)}
                    className={cn("flex items-start gap-3 rounded-xl border p-4 text-left transition-colors", active ? "border-foreground ring-1 ring-foreground" : "hover:border-foreground/30")}
                  >
                    <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border", active && "border-foreground bg-foreground text-background")}>
                      {active ? <Check className="size-3" /> : null}
                    </span>
                    <span className="text-sm">
                      <span className="block font-medium">{[a.firstName, a.lastName].filter(Boolean).join(" ") || "Address"}</span>
                      <span className="text-muted-foreground">{formatShopAddress(a)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="flex h-fit flex-col gap-4 rounded-2xl border bg-muted/30 p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold">Order summary</h2>
          {c ? (
            <ul className="flex flex-col gap-2 text-sm">
              {c.items.map((i) => (
                <li key={i.variantId} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {i.quantity} × {i.productName}
                  </span>
                  <span className="tabular shrink-0">{money(i.lineTotal, c.currency)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Skeleton className="h-16 w-full" />
          )}
          <dl className="flex flex-col gap-1.5 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular">{c ? money(totals.subtotal, c.currency) : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{gstLabel(totals.rate)}</dt>
              <dd className="tabular">{c ? money(totals.gst, c.currency) : "—"}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <dt>Estimated total</dt>
              <dd className="tabular">{c ? money(totals.total, c.currency) : "—"}</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">Final totals are confirmed by {store.name} when you place the order.</p>
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button size="lg" className="rounded-full" disabled={!shippingId || adding || !c?.readyForCheckout} loading={place.isPending || completePayment.isPending} onClick={() => { setError(null); place.mutate(); }}>
            <Lock /> {store.onlinePayment.enabled ? "Place order and pay" : "Place order"}
          </Button>
          {!store.onlinePayment.enabled ? <p className="text-xs text-muted-foreground">{store.name} will contact you to arrange payment.</p> : null}
        </aside>
      </div>
    </div>
  );
}
