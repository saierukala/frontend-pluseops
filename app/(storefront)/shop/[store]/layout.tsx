"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { StoreIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/app/states";
import { ShopProvider } from "@/features/storefront/shop-context";
import { ShopFooter, ShopHeader } from "@/features/storefront/shop-chrome";
import { StorefrontClient } from "@/lib/storefront/api";
import { ApiError } from "@/lib/api/errors";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const { store: slug } = useParams<{ store: string }>();
  const store = useQuery({
    queryKey: ["shop", slug, "store"],
    queryFn: () => new StorefrontClient(slug).getStore(),
    staleTime: 5 * 60_000,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });

  const storeName = store.data?.name;
  React.useEffect(() => {
    if (storeName) document.title = storeName;
  }, [storeName]);

  if (store.isLoading) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />)}</div>
      </div>
    );
  }

  if (store.error instanceof ApiError && store.error.status === 404) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl border bg-muted/50 text-muted-foreground">
          <StoreIcon className="size-5" />
        </span>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">This store isn&apos;t available</h1>
          <p className="text-sm text-muted-foreground">Check the address, or the shop may be closed for now.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={"/store" as never}>Find a store</Link>
        </Button>
      </div>
    );
  }

  if (!store.data) return <ErrorState error={store.error} onRetry={() => store.refetch()} className="min-h-screen" />;

  return (
    <ShopProvider slug={slug} store={store.data}>
      <div className="flex min-h-screen flex-col bg-background">
        <ShopHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <React.Suspense>{children}</React.Suspense>
        </main>
        <ShopFooter />
      </div>
    </ShopProvider>
  );
}
