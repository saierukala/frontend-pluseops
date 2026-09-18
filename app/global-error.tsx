"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  retry?: () => void;
};

export default function GlobalError({ error, reset, retry }: GlobalErrorProps) {
  const handleRetry = reset ?? retry ?? (() => window.location.reload());

  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
          <div className="w-full max-w-lg rounded-xl border bg-card p-8 shadow-sm">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-center text-lg font-semibold">Critical error</h1>
            <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">
              The application encountered a critical error at the root layout. This is the global
              error boundary — it preserves the html/body shell.
            </p>
            {error.digest ? (
              <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-center font-mono text-xs text-muted-foreground">
                digest: {error.digest}
              </p>
            ) : null}
            <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
              {error.message || "Unknown error"}
            </p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => handleRetry()}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-[var(--primary-hover)]"
              >
                Reload application
              </button>
            </div>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">PulseOps — Global error UI (F01)</p>
        </div>
      </body>
    </html>
  );
}
