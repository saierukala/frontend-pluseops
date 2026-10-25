"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/app/states";
import { ProductImage } from "@/features/storefront/product-card";
import { useAddToCart, useShop } from "@/features/storefront/shop-context";
import { cn } from "@/lib/utils";

export default function ShopProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();
  const { client, slug, href, money, signedIn } = useShop();
  const product = useQuery({ queryKey: ["shop", slug, "product", productId], queryFn: () => client.getProduct(productId) });
  const addToCart = useAddToCart();

  const [variantId, setVariantId] = React.useState<string | null>(null);
  const [imageIndex, setImageIndex] = React.useState(0);
  const [quantity, setQuantity] = React.useState(1);

  const p = product.data;
  // Default to the first in-stock variant until the shopper picks one
  const variant = p?.variants.find((v) => v.id === variantId) ?? p?.variants.find((v) => v.inStock) ?? p?.variants[0];

  if (product.error) return <ErrorState error={product.error} onRetry={() => product.refetch()} />;
  if (!p || !variant) {
    return (
      <div className="grid gap-10 md:grid-cols-2">
        <Skeleton className="aspect-square rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const image = p.images[imageIndex] ?? p.images[0];
  const optionLabel = (attrs: Record<string, string>, sku: string) => (Object.values(attrs).length ? Object.values(attrs).join(" / ") : sku);

  function handleAdd() {
    if (!signedIn) {
      router.push(`${href("/login")}?next=${encodeURIComponent(href(`/products/${productId}`))}` as never);
      return;
    }
    addToCart.mutate({ variantId: variant!.id, quantity, name: p!.name });
  }

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground" asChild>
        <Link href={href() as never}>
          <ArrowLeft /> Back to shop
        </Link>
      </Button>
      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        <div className="flex flex-col gap-3">
          <div className="aspect-square overflow-hidden rounded-3xl border bg-muted">
            <ProductImage src={image?.url} alt={image?.altText} name={p.name} />
          </div>
          {p.images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto">
              {p.images.map((img, i) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => setImageIndex(i)}
                  aria-label={`Show image ${i + 1}`}
                  className={cn("size-16 shrink-0 overflow-hidden rounded-xl border-2", i === imageIndex ? "border-foreground" : "border-transparent opacity-70 hover:opacity-100")}
                >
                  <ProductImage src={img.url} alt={img.altText} name={p.name} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            {p.brand ? <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{p.brand}</p> : null}
            <h1 className="text-3xl font-semibold tracking-tight">{p.name}</h1>
            <p className="tabular text-2xl font-semibold">{money(variant.price, p.currency)}</p>
            {p.categories.length ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {p.categories.map((c) => (
                  <Link key={c.id} href={`${href()}?category=${c.slug}` as never} className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:text-foreground">
                    {c.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {p.variants.length > 1 ? (
            <fieldset className="space-y-2.5">
              <legend className="text-sm font-medium">Option</legend>
              <div className="flex flex-wrap gap-2">
                {p.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    disabled={!v.inStock}
                    aria-pressed={v.id === variant.id}
                    onClick={() => setVariantId(v.id)}
                    className={cn(
                      "flex min-w-16 items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through",
                      v.id === variant.id ? "border-foreground bg-foreground text-background" : "hover:border-foreground/40"
                    )}
                  >
                    {v.id === variant.id ? <Check className="size-3.5" /> : null}
                    {optionLabel(v.attributes, v.sku)}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          <div className="flex items-center gap-3">
            <div className="flex h-11 items-center rounded-full border">
              <Button type="button" variant="ghost" size="icon" className="rounded-full" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((q) => q - 1)}>
                <Minus />
              </Button>
              <span className="tabular w-8 text-center font-medium" aria-live="polite">
                {quantity}
              </span>
              <Button type="button" variant="ghost" size="icon" className="rounded-full" aria-label="Increase quantity" disabled={quantity >= 100} onClick={() => setQuantity((q) => q + 1)}>
                <Plus />
              </Button>
            </div>
            <Button size="lg" className="h-11 flex-1 rounded-full" disabled={!variant.inStock} loading={addToCart.isPending} onClick={handleAdd}>
              <ShoppingBag /> {variant.inStock ? "Add to cart" : "Sold out"}
            </Button>
          </div>
          {!signedIn ? <p className="-mt-3 text-sm text-muted-foreground">You&apos;ll be asked to sign in to keep your cart.</p> : null}

          {p.description ? (
            <div className="space-y-2 border-t pt-6">
              <h2 className="text-sm font-semibold">Details</h2>
              <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{p.description}</p>
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">SKU {variant.sku}</p>
        </div>
      </div>
    </div>
  );
}
