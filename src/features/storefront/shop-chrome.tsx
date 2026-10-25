"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Mail, Moon, Package, Phone, Search, ShoppingBag, Store as StoreIcon, Sun, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fullName } from "@/lib/format";
import { useCart, useShop } from "./shop-context";

function StoreMark({ name }: { name: string }) {
  return (
    <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[color-mix(in_oklch,var(--primary)_55%,var(--chart-2))] text-sm font-bold text-primary-foreground shadow-sm" aria-hidden>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function HeaderSearch() {
  const { href } = useShop();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = React.useState(params.get("q") ?? "");
  return (
    <form
      role="search"
      className="hidden max-w-md flex-1 md:block"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`${href()}${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}` as never);
      }}
    >
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" aria-label="Search products" leftElement={<Search className="size-4" />} className="h-10 rounded-full bg-muted/40" />
    </form>
  );
}

function AccountMenu() {
  const { shopper, client, href, slug } = useShop();
  const queryClient = useQueryClient();
  const router = useRouter();

  if (!shopper) {
    return (
      <Button variant="ghost" asChild>
        <Link href={href("/login") as never}>
          <UserRound /> <span className="hidden sm:inline">Sign in</span>
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" aria-label="Your account">
          <UserRound /> <span className="hidden max-w-28 truncate sm:inline">{shopper.firstName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{fullName(shopper)}</p>
          <p className="truncate text-xs text-muted-foreground">{shopper.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={href("/account") as never}>
            <Package /> Orders & account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            await client.logout();
            queryClient.removeQueries({ queryKey: ["shop", slug] });
            router.push(href() as never);
          }}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CartButton() {
  const { href } = useShop();
  const cart = useCart();
  const count = cart.data?.itemCount ?? 0;
  return (
    <Button variant="outline" className="relative rounded-full" asChild>
      <Link href={href("/cart") as never} aria-label={count ? `Cart, ${count} items` : "Cart"}>
        <ShoppingBag />
        <span className="hidden sm:inline">Cart</span>
        {count ? <span className="tabular flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-5 text-primary-foreground">{count}</span> : null}
      </Link>
    </Button>
  );
}

function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </Button>
  );
}

export function ShopHeader() {
  const { store, href } = useShop();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href={href() as never} className="flex shrink-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <StoreMark name={store.name} />
          <span className="max-w-48 truncate text-base font-semibold tracking-tight">{store.name}</span>
        </Link>
        <React.Suspense fallback={<div className="hidden flex-1 md:block" />}>
          <HeaderSearch />
        </React.Suspense>
        <nav className="ml-auto flex items-center gap-1">
          <ThemeButton />
          <AccountMenu />
          <CartButton />
        </nav>
      </div>
    </header>
  );
}

export function ShopFooter() {
  const { store } = useShop();
  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 text-sm sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <StoreMark name={store.name} />
          <div>
            <p className="font-semibold">{store.name}</p>
            <p className="text-muted-foreground">Prices in {store.currency ?? "USD"}</p>
          </div>
        </div>
        {store.contactEmail || store.contactPhone ? (
          <div className="flex flex-col gap-1.5 text-muted-foreground">
            <p className="font-medium text-foreground">Need help?</p>
            {store.contactEmail ? (
              <a href={`mailto:${store.contactEmail}`} className="flex items-center gap-2 hover:text-foreground">
                <Mail className="size-4" /> {store.contactEmail}
              </a>
            ) : null}
            {store.contactPhone ? (
              <a href={`tel:${store.contactPhone}`} className="flex items-center gap-2 hover:text-foreground">
                <Phone className="size-4" /> {store.contactPhone}
              </a>
            ) : null}
          </div>
        ) : null}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <StoreIcon className="size-3.5" /> Powered by PulseOps
        </p>
      </div>
    </footer>
  );
}
