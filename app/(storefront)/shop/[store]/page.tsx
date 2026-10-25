"use client";

import * as React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, PackageSearch, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { SelectRoot, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorState } from "@/components/app/states";
import { ProductCard } from "@/features/storefront/product-card";
import { useShop } from "@/features/storefront/shop-context";
import { useUrlState } from "@/hooks/use-url-state";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name", label: "Name" },
];

export default function ShopHomePage() {
  const { client, slug, store, signedIn, shopper } = useShop();
  const { get, set, page } = useUrlState();
  const q = get("q");
  const category = get("category");
  const sort = get("sort", "newest");
  const inStock = get("inStock") === "true";

  const categories = useQuery({ queryKey: ["shop", slug, "categories"], queryFn: () => client.listCategories(), staleTime: 5 * 60_000 });
  const products = useQuery({
    queryKey: ["shop", slug, "products", { page, q, category, sort, inStock }],
    queryFn: () => client.listProducts({ page, limit: 24, search: q || undefined, category: category || undefined, sort, inStock: inStock || undefined }),
    placeholderData: keepPreviousData,
  });
  const meta = products.data?.meta;
  const browsing = Boolean(q || category);

  return (
    <div className="flex flex-col gap-8">
      {!browsing && page === 1 ? (
        <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/15 via-background to-[color-mix(in_oklch,var(--chart-2)_18%,var(--background))] px-6 py-12 sm:px-12 sm:py-16">
          <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" aria-hidden />
          <div className="relative max-w-xl space-y-3">
            <p className="text-sm font-medium text-primary">{signedIn ? `Welcome back, ${shopper?.firstName}` : "Welcome"}</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{store.name}</h1>
            <p className="text-base text-muted-foreground sm:text-lg">Browse the catalog and check out in a few steps. Prices in {store.currency ?? "USD"}.</p>
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Categories">
          <CategoryChip active={!category} onClick={() => set({ category: null })}>
            All
          </CategoryChip>
          {categories.isLoading
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />)
            : categories.data?.map((c) => (
                <CategoryChip key={c.id} active={category === c.slug} onClick={() => set({ category: c.slug })}>
                  {c.name}
                </CategoryChip>
              ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {q ? (
              <span className="inline-flex items-center gap-2">
                Results for <span className="font-medium text-foreground">“{q}”</span>
                <button type="button" onClick={() => set({ q: null })} className="rounded-full p-0.5 hover:bg-muted" aria-label="Clear search">
                  <X className="size-3.5" />
                </button>
              </span>
            ) : meta ? (
              `${meta.total} product${meta.total === 1 ? "" : "s"}`
            ) : null}
          </p>
          <div className="ml-auto flex items-center gap-4">
            <Switch checked={inStock} onCheckedChange={(v) => set({ inStock: v ? "true" : null })} label="In stock only" size="sm" />
            <SelectRoot value={sort} onValueChange={(v) => set({ sort: v === "newest" ? null : v })}>
              <SelectTrigger className="h-9 w-48" aria-label="Sort products">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>
        </div>
      </div>

      {products.error ? (
        <ErrorState error={products.error} onRetry={() => products.refetch()} />
      ) : products.isLoading ? (
        <ProductGridSkeleton />
      ) : products.data?.data.length ? (
        <div className={cn("grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4", products.isFetching && "opacity-70 transition-opacity")}>
          {products.data.data.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={PackageSearch}
          title="Nothing matches"
          description="Try another search or category."
          action={browsing || inStock ? <Button variant="outline" size="sm" onClick={() => set({ q: null, category: null, inStock: null })}>Show everything</Button> : undefined}
        />
      )}

      {meta && meta.totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-3" aria-label="Pages">
          <Button variant="outline" size="icon" aria-label="Previous page" disabled={page <= 1} onClick={() => set({ page: page - 1 })}>
            <ChevronLeft />
          </Button>
          <span className="tabular text-sm text-muted-foreground">
            Page {page} of {meta.totalPages}
          </span>
          <Button variant="outline" size="icon" aria-label="Next page" disabled={page >= meta.totalPages} onClick={() => set({ page: page + 1 })}>
            <ChevronRight />
          </Button>
        </nav>
      ) : null}
    </div>
  );
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
        active ? "border-foreground bg-foreground text-background" : "bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[4/5] rounded-2xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
