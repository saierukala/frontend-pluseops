"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useShop } from "./shop-context";

/** Sends signed-out shoppers to sign in, then back here. */
export function RequireShopper({ children }: { children: React.ReactNode }) {
  const { signedIn, href } = useShop();
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = React.useState(false);

  // The session lives in localStorage, which isn't readable during the server render
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);
  React.useEffect(() => {
    if (hydrated && !signedIn) router.replace(`${href("/login")}?next=${encodeURIComponent(pathname)}` as never);
  }, [hydrated, signedIn, href, pathname, router]);

  if (!hydrated || !signedIn) return <Skeleton className="h-64 w-full rounded-2xl" />;
  return <>{children}</>;
}
