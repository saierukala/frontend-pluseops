"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ProductCard, type ProductCardProps } from "./product-card";
import { EmptyState } from "@/components/ui/empty-state";

export interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: (ProductCardProps & { id: string })[];
  loading?: boolean;
  loadingCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  columns?: 2 | 3 | 4;
}

export function ProductGrid({
  className,
  products,
  loading,
  loadingCount = 8,
  emptyTitle = "No products found",
  emptyDescription = "Try adjusting your filters or search.",
  columns = 4,
  ...props
}: ProductGridProps) {
  const colMap: Record<number, string> = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  if (loading) {
    return (
      <div className={cn("grid gap-4", colMap[columns], className)} {...props}>
        {Array.from({ length: loadingCount }).map((_, i) => (
          <ProductCard key={i} title="" price={0} loading />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M7 12h10" />
          </svg>
        }
      />
    );
  }

  return (
    <div className={cn("grid gap-4", colMap[columns], className)} {...props}>
      {products.map((p) => (
        <ProductCard key={p.id} {...p} />
      ))}
    </div>
  );
}
