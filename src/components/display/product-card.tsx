"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "./money-display";
import { StatusBadge } from "./status-badge";

export interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: string;
  title: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  currency?: string;
  status?: string;
  stockLabel?: string;
  rating?: number;
  onAddToCart?: () => void;
  onView?: () => void;
  loading?: boolean;
  compact?: boolean;
}

export function ProductCard({
  className,
  image,
  title,
  sku,
  price,
  compareAtPrice,
  currency = "INR",
  status,
  stockLabel,
  rating,
  onAddToCart,
  onView,
  loading,
  compact,
  ...props
}: ProductCardProps) {
  if (loading) {
    return (
      <div className={cn("overflow-hidden rounded-xl border bg-card shadow-xs", className)} {...props}>
        <div className="h-48 animate-pulse bg-muted" />
        <div className="space-y-3 p-4">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-8 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-all hover:shadow-md",
        compact ? "p-3" : "",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          compact ? "rounded-lg h-32" : "h-48"
        )}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}
        {status ? (
          <span className="absolute left-2 top-2">
            <StatusBadge status={status} />
          </span>
        ) : null}
        {stockLabel ? (
          <span className="absolute right-2 top-2">
            <Badge variant={stockLabel.toLowerCase().includes("out") ? "destructive" : "success"} size="sm">
              {stockLabel}
            </Badge>
          </span>
        ) : null}
      </div>

      <div className={cn("flex flex-1 flex-col", compact ? "pt-3" : "p-4")}>
        <h3 className="line-clamp-2 text-sm font-semibold leading-5">{title}</h3>
        {sku ? <p className="mt-1 text-xs text-muted-foreground">SKU: {sku}</p> : null}
        {rating !== undefined ? (
          <div className="mt-1.5 flex items-center gap-1 text-xs">
            <span className="text-amber-500" aria-hidden>
              ★
            </span>
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-muted-foreground">(rating)</span>
          </div>
        ) : null}

        <div className="mt-3 flex items-baseline gap-2">
          <MoneyDisplay amount={price} currency={currency} size={compact ? "md" : "md"} />
          {compareAtPrice && compareAtPrice > price ? (
            <span className="text-xs text-muted-foreground line-through">
              <MoneyDisplay amount={compareAtPrice} currency={currency} size="sm" className="text-muted-foreground font-normal" />
            </span>
          ) : null}
        </div>

        {(onAddToCart || onView) && (
          <div className="mt-4 flex gap-2">
            {onView ? (
              <Button variant="outline" size="sm" className="flex-1" onClick={onView}>
                View
              </Button>
            ) : null}
            {onAddToCart ? (
              <Button variant="primary" size="sm" className="flex-1" onClick={onAddToCart}>
                Add to cart
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
