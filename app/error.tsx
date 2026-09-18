"use client";

import Link from "next/link";
import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  retry?: () => void;
};

export default function Error({ error, reset, retry }: ErrorProps) {
  const handleRetry = reset ?? retry ?? (() => window.location.reload());

  useEffect(() => {
    // F01: log to console; later phases can forward to error reporting service.
    console.error("[PulseOps] Segment error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-lg rounded-xl border bg-card p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-center text-lg font-semibold tracking-tight">Something went wrong</h2>
        <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">
          An unexpected error occurred while rendering this section. You can try again, or return
          home. If the problem persists, share the request ID with support.
        </p>
        {error.digest ? (
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-center font-mono text-xs text-muted-foreground">
            digest: {error.digest}
          </p>
        ) : null}
        <p className="mt-2 line-clamp-3 rounded-lg bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
          {error.message || "Unknown error"}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => handleRetry()}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-lg border bg-card px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Go home
          </Link>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Error boundary — F01 foundation. Errors bubble to the nearest segment.
        </p>
      </div>
    </div>
  );
}
