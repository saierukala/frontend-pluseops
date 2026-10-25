"use client";

import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { StoreProductSummary } from "@/lib/storefront/api";
import { apiAssetUrl } from "@/lib/api/config";
import { cn } from "@/lib/utils";
import { useShop } from "./shop-context";

/** Product photo, or a soft monogram tile when the product has no image. */
export function ProductImage({ src, alt, name, className }: { src?: string | null; alt?: string | null; name: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from the API, not optimizable
    return <img src={apiAssetUrl(src)} alt={alt ?? name} loading="lazy" className={cn("size-full object-cover", className)} />;
  }
  return (
    <div className={cn("flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-accent/60 text-muted-foreground", className)} aria-hidden>
      <span className="text-4xl font-semibold tracking-tight text-foreground/20">{name.slice(0, 1).toUpperCase()}</span>
      <ImageOff className="size-4 opacity-40" />
    </div>
  );
}

export function ProductCard({ product }: { product: StoreProductSummary }) {
  const { href, money } = useShop();
  const range = product.priceFrom === product.priceTo ? money(product.priceFrom, product.currency) : `${money(product.priceFrom, product.currency)} – ${money(product.priceTo, product.currency)}`;
  return (
    <Link href={href(`/products/${product.id}`) as never} className="group flex flex-col gap-3 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border bg-muted">
        <div className="size-full transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none">
          <ProductImage src={product.image?.url} alt={product.image?.altText} name={product.name} />
        </div>
        {!product.inStock ? <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm">Sold out</span> : null}
      </div>
      <div className="space-y-0.5 px-1">
        {product.brand ? <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.brand}</p> : null}
        <p className="line-clamp-2 font-medium leading-snug group-hover:underline">{product.name}</p>
        <p className="tabular text-sm font-semibold">{range}</p>
      </div>
    </Link>
  );
}
