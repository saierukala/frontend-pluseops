"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { StorefrontClient, type Cart, type Shopper, type Store } from "@/lib/storefront/api";
import { formatMoney } from "@/lib/format";
import { toastError } from "@/lib/api-errors";

interface ShopContextValue {
  slug: string;
  client: StorefrontClient;
  store: Store;
  shopper: Shopper | null;
  signedIn: boolean;
  /** Formats a decimal string in the store's currency. */
  money: (value: string | number | null | undefined, currency?: string) => string;
  href: (path?: string) => string;
}

const ShopContext = React.createContext<ShopContextValue | null>(null);

export function useShop(): ShopContextValue {
  const ctx = React.useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside <ShopProvider>");
  return ctx;
}

/** Re-reads the per-store shopper session when it changes in this tab or another one. */
function useShopperSession(client: StorefrontClient): Shopper | null {
  const subscribe = React.useCallback((onChange: () => void) => {
    const onStorage = (e: StorageEvent) => e.key === `pulseops:shop:${client.slug}` && onChange();
    window.addEventListener("pulseops:shopper-session", onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("pulseops:shopper-session", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [client]);
  // Snapshot is the raw stored string so identity only changes when the session does
  const raw = React.useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(`pulseops:shop:${client.slug}`);
      } catch {
        return null;
      }
    },
    () => null
  );
  return React.useMemo(() => {
    if (!raw) return null;
    try {
      return (JSON.parse(raw) as { customer: Shopper }).customer;
    } catch {
      return null;
    }
  }, [raw]);
}

export function ShopProvider({ slug, store, children }: { slug: string; store: Store; children: React.ReactNode }) {
  const client = React.useMemo(() => new StorefrontClient(slug), [slug]);
  const shopper = useShopperSession(client);
  const currency = store.currency ?? "INR";

  const value = React.useMemo<ShopContextValue>(
    () => ({
      slug,
      client,
      store,
      shopper,
      signedIn: Boolean(shopper),
      money: (v, c) => formatMoney(v, c ?? currency),
      href: (path = "") => `/shop/${slug}${path}`,
    }),
    [slug, client, store, shopper, currency]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

/** The signed-in shopper's cart; empty (not fetched) when signed out. */
export function useCart() {
  const { client, slug, signedIn } = useShop();
  return useQuery<Cart>({ queryKey: ["shop", slug, "cart"], queryFn: () => client.getCart(), enabled: signedIn });
}

/** Cart subtotal plus estimated GST at the store's rate (the order total is computed server-side at checkout). */
export function useCartTotals(cart: Cart | undefined) {
  const { store } = useShop();
  const rate = store.gstRatePercent ?? 18;
  const subtotal = Number(cart?.subtotal ?? 0);
  const gst = Math.round(subtotal * rate) / 100;
  return { rate, subtotal, gst, total: subtotal + gst };
}

export function useSetCartItem() {
  const { client, slug } = useShop();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      quantity > 0 ? client.setCartItem(variantId, quantity) : client.removeCartItem(variantId),
    onSuccess: (cart) => queryClient.setQueryData(["shop", slug, "cart"], cart),
    onError: (e) => toastError(e, "Couldn't update your cart"),
  });
}

/** Adds to the cart on top of what's already there, and confirms with a toast linking to the cart. */
export function useAddToCart() {
  const { client, slug, money } = useShop();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ variantId, quantity }: { variantId: string; quantity: number; name: string }) => {
      const current = queryClient.getQueryData<Cart>(["shop", slug, "cart"]) ?? (await client.getCart());
      const existing = current.items.find((i) => i.variantId === variantId)?.quantity ?? 0;
      return client.setCartItem(variantId, Math.min(100, existing + quantity));
    },
    onSuccess: (cart, { name }) => {
      queryClient.setQueryData(["shop", slug, "cart"], cart);
      toast.success(`Added ${name}`, { description: `${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"} · ${money(cart.subtotal, cart.currency)}` });
    },
    onError: (e) => toastError(e, "Couldn't add to cart"),
  });
}
