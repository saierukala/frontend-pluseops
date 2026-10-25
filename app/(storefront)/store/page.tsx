"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveStoreHost } from "@/lib/storefront/api";

/**
 * Entry point for shoppers. A custom domain (or <slug>.<base domain>) resolves straight to its shop;
 * otherwise NEXT_PUBLIC_DEFAULT_STORE is used, and failing that the shopper can enter the store's name.
 */
export default function StoreFinderPage() {
  const router = useRouter();
  const [checking, setChecking] = React.useState(true);
  const [slug, setSlug] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const fromHost = await resolveStoreHost(window.location.host);
      const target = fromHost ?? process.env.NEXT_PUBLIC_DEFAULT_STORE ?? null;
      if (cancelled) return;
      if (target) router.replace(`/shop/${target}` as never);
      else setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-40 w-80 rounded-2xl" />
      </div>
    );
  }

  const value = slug.trim().toLowerCase();
  return (
    <div className="bg-grid flex min-h-screen items-center justify-center px-4">
      <form
        className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border bg-card p-8 text-center shadow-lg"
        onSubmit={(e) => {
          e.preventDefault();
          if (/^[a-z0-9-]+$/.test(value)) router.push(`/shop/${value}` as never);
        }}
      >
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <StoreIcon className="size-5" />
        </span>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Visit a store</h1>
          <p className="text-sm text-muted-foreground">Enter the store name from your invitation or receipt.</p>
        </div>
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme" aria-label="Store name" autoFocus className="h-11 text-center" />
        <Button type="submit" size="lg" disabled={!/^[a-z0-9-]+$/.test(value)}>
          Go to store <ArrowRight />
        </Button>
      </form>
    </div>
  );
}
