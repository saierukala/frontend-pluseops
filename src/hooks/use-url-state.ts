"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Value = string | number | null | undefined;

/**
 * List-page state (page, search, filters) kept in the URL so views are shareable and survive
 * reloads/back. Empty values and "all" are removed; changing anything but `page` resets paging.
 */
export function useUrlState() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const get = React.useCallback((key: string, fallback = "") => params.get(key) ?? fallback, [params]);

  const set = React.useCallback(
    (updates: Record<string, Value>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "" || value === "all") next.delete(key);
        else next.set(key, String(value));
      }
      if (!("page" in updates)) next.delete("page");
      const qs = next.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}` as never, { scroll: false });
    },
    [params, pathname, router]
  );

  const page = Math.max(1, Number(params.get("page")) || 1);
  return { get, set, page, params };
}
