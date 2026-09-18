import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl border bg-card shadow-xs">
          <span className="font-mono text-sm font-bold tracking-tight">404</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist, was moved, or you don&apos;t have
          access. Check the URL or return to the PulseOps home.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to home
          </Link>
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-lg border bg-card px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Go to dashboard
          </Link>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          If you believe this is an error, contact support with request ID and URL.
        </p>
        <div className="mt-4 rounded-lg border bg-muted/40 px-4 py-3 text-left font-mono text-xs text-muted-foreground">
          <div>Not-found boundary — F01 foundation</div>
          <div className="mt-1 break-all">Path: not-found.tsx at app/ segment</div>
        </div>
      </div>
    </div>
  );
}
