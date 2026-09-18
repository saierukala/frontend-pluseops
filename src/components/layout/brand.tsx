"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function PulseOpsBrand({
  href = "/dashboard",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href as unknown as never}
      className={cn("flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg", className)}
      aria-label="PulseOps home"
    >
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 12h6l2-6 4 12 2-6h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={cn("font-semibold tracking-tight text-sm", compact && "hidden lg:inline")}>PulseOps</span>
      {!compact ? <span className="hidden rounded-full border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground xl:inline-flex">Tenant</span> : null}
    </Link>
  );
}

export function PlatformBrand({ href = "/platform", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href as unknown as never}
      className={cn("flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg", className)}
      aria-label="PulseOps Platform home"
    >
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-background shadow-xs" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M7 12h10M12 7v10" />
        </svg>
      </span>
      <span className="font-semibold tracking-tight text-sm">PulseOps</span>
      <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold tracking-wide text-background">PLATFORM</span>
    </Link>
  );
}

export function StorefrontBrand({ href = "/store", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href as unknown as never}
      className={cn("flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg", className)}
      aria-label="PulseOps Store home"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 7h12l-1 9H7L6 7z" />
          <path d="M9 7V5a3 3 0 0 1 6 0v2" />
        </svg>
      </span>
      <span className="font-semibold tracking-tight text-[15px]">PulseOps Store</span>
    </Link>
  );
}

