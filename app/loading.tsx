export default function Loading() {
  return (
    <div className="container-pulse py-8" aria-busy="true" aria-live="polite" aria-label="Loading">
      {/* Header skeleton */}
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 max-w-lg animate-pulse rounded bg-muted" />

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-3">
          <div className="space-y-3 rounded-xl border bg-card p-5">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          </div>
          <div className="space-y-3 rounded-xl border bg-card p-5">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          </div>
          <div className="space-y-3 rounded-xl border bg-card p-5">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
          </div>
        </div>

        <p className="sr-only">Loading PulseOps…</p>
      </div>
    </div>
  );
}
