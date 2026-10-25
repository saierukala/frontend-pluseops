"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/app/states";
import { RequireShopper } from "@/features/storefront/require-shopper";
import { ProductImage } from "@/features/storefront/product-card";
import { useCart, useSetCartItem, useShop } from "@/features/storefront/shop-context";

export default function CartPage() {
  return (
    <RequireShopper>
      <Cart />
    </RequireShopper>
  );
}

function Cart() {
  const { href, money } = useShop();
  const cart = useCart();
  const setItem = useSetCartItem();

  if (cart.error) return <ErrorState error={cart.error} onRetry={() => cart.refetch()} />;
  if (!cart.data) return <Skeleton className="h-64 w-full rounded-2xl" />;
  const c = cart.data;

  if (!c.items.length) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        description="Find something you love and it'll show up here."
        action={
          <Button asChild className="rounded-full">
            <Link href={href() as never}>Start shopping</Link>
          </Button>
        }
        className="py-24"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Your cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <ul className="flex flex-col divide-y rounded-2xl border">
          {c.items.map((line) => (
            <li key={line.variantId} className="flex gap-4 p-4 sm:p-5">
              <Link href={href(`/products/${line.productId}`) as never} className="size-20 shrink-0 overflow-hidden rounded-xl border bg-muted sm:size-24">
                <ProductImage name={line.productName} />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={href(`/products/${line.productId}`) as never} className="line-clamp-2 font-medium hover:underline">
                      {line.productName}
                    </Link>
                    <p className="text-sm text-muted-foreground">{Object.values(line.attributes).join(" / ") || line.sku}</p>
                  </div>
                  <p className="tabular shrink-0 font-semibold">{money(line.lineTotal, c.currency)}</p>
                </div>
                {line.issue ? (
                  <p className="flex items-center gap-1.5 text-sm text-warning">
                    <AlertTriangle className="size-3.5" /> {line.issue}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center gap-3 pt-2">
                  <div className="flex h-9 items-center rounded-full border">
                    <Button variant="ghost" size="icon" className="size-9 rounded-full" aria-label="Decrease quantity" disabled={setItem.isPending} onClick={() => setItem.mutate({ variantId: line.variantId, quantity: line.quantity - 1 })}>
                      <Minus />
                    </Button>
                    <span className="tabular w-7 text-center text-sm font-medium">{line.quantity}</span>
                    <Button variant="ghost" size="icon" className="size-9 rounded-full" aria-label="Increase quantity" disabled={setItem.isPending || line.quantity >= 100} onClick={() => setItem.mutate({ variantId: line.variantId, quantity: line.quantity + 1 })}>
                      <Plus />
                    </Button>
                  </div>
                  <span className="tabular text-sm text-muted-foreground">{money(line.unitPrice, c.currency)} each</span>
                  <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground" onClick={() => setItem.mutate({ variantId: line.variantId, quantity: 0 })}>
                    <Trash2 /> Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="flex h-fit flex-col gap-4 rounded-2xl border bg-muted/30 p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold">Summary</h2>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Items</dt>
              <dd className="tabular">{c.itemCount}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <dt>Subtotal</dt>
              <dd className="tabular">{money(c.subtotal, c.currency)}</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">Shipping and taxes are calculated at checkout.</p>
          {!c.readyForCheckout ? <p className="text-sm text-warning">Fix the highlighted items to continue.</p> : null}
          {c.readyForCheckout ? (
            <Button size="lg" className="rounded-full" asChild>
              <Link href={href("/checkout") as never}>
                Checkout <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button size="lg" className="rounded-full" disabled>
              Checkout <ArrowRight />
            </Button>
          )}
        </aside>
      </div>
    </div>
  );
}
