import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container-pulse flex h-14 items-center justify-between">
          <Link href={"/" as unknown as never} className="flex items-center gap-2.5">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"
              aria-hidden
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M3 12h6l2-6 4 12 2-6h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[15px] font-semibold tracking-tight">PulseOps</span>
            <span className="hidden rounded-full border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground sm:inline-flex">
              F01 Foundation
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Production foundation — App Router + TypeScript
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              Automated verified
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col">
        <section className="container-pulse flex flex-1 flex-col gap-10 py-12 md:py-16">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium shadow-xs">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Next.js 16 · TypeScript 5 · Tailwind CSS 4 · ESLint 9
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              PulseOps frontend foundation
              <span className="block text-primary">is ready for product work.</span>
            </h1>
            <p className="mx-auto max-w-2xl text-pretty text-base leading-7 text-muted-foreground md:text-lg">
              Production-grade App Router setup with metadata, design tokens, error boundaries,
              loading and not-found handling, environment validation, and path aliases — without
              jumping ahead to design system or business modules.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <div className="inline-flex items-center rounded-lg border bg-card px-3 py-2 text-xs font-medium shadow-xs">
                <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
                npm run build — verified
              </div>
              <div className="inline-flex items-center rounded-lg border bg-card px-3 py-2 text-xs font-medium shadow-xs">
                <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
                npm run lint — clean
              </div>
              <div className="inline-flex items-center rounded-lg border bg-card px-3 py-2 text-xs font-medium shadow-xs">
                <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
                tsc --noEmit — passing
              </div>
            </div>
          </div>

          {/* F03 Shell entry */}
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">F03 — Application Shell</span>
              <span className="text-xs text-muted-foreground">Root · Tenant · Platform · Storefront — responsive, no API calls</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Link href={"/dashboard" as unknown as never} className="rounded-xl border bg-background p-4 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                <div className="text-sm font-semibold">Tenant Dashboard →</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">Sidebar + topbar · 9 groups · workspace identity</div>
              </Link>
              <Link href={"/platform" as unknown as never} className="rounded-xl border bg-slate-900 p-4 text-slate-100 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-ring">
                <div className="text-sm font-semibold">Platform Admin →</div>
                <div className="mt-1 text-xs leading-5 text-slate-400">Dark control plane · UI-only (no /platform/* API)</div>
              </Link>
              <Link href={"/store" as unknown as never} className="rounded-xl border bg-background p-4 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                <div className="text-sm font-semibold">Storefront →</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">Commerce header · search · cart · distinct from dashboard</div>
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link href={"/shell" as unknown as never} className="rounded-full bg-foreground px-3 py-1.5 font-medium text-background hover:bg-foreground/90">Shell showcase — /shell</Link>
              <Link href={"/design-system" as unknown as never} className="rounded-full border bg-card px-3 py-1.5 font-medium hover:bg-accent">Design system — /design-system</Link>
              <span className="rounded-full border bg-muted px-3 py-1.5 text-muted-foreground">375 · 768 · 1024 · 1280 · dark · keyboard</span>
            </div>
          </div>

          {/* Feature grid */}
          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-5 shadow-xs">
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 3v18M3 12h18" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold">App Router foundation</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Root layout, metadata API, viewport, favicon/brand assets, robots & sitemap,
                manifest and OG image.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">layout.tsx</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">icon.svg</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">globals.css</span>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-xs">
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 8v8M8 12h8" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold">Resilience</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Segment error boundary, global-error fallback, loading skeletons and polished
                not-found page.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">error.tsx</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">loading.tsx</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">not-found.tsx</span>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-xs">
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M8 6h8M8 12h8M8 18h8" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold">Foundation toolkit</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Typed env validation, path alias `@/*`, formatting, design tokens and production
                build config.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">@/config/env</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">tokens</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">next.config</span>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div className="mx-auto w-full max-w-5xl rounded-xl border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="text-sm font-semibold">F01 acceptance — run locally</h2>
              <p className="text-sm text-muted-foreground">
                Commands below must pass before requesting human verification. No F02 work included.
              </p>
            </div>
            <div className="grid gap-0 md:grid-cols-3">
              <code className="border-b bg-muted/40 px-5 py-3 text-xs font-mono md:border-b-0 md:border-r">
                npm run dev
              </code>
              <code className="border-b bg-muted/40 px-5 py-3 text-xs font-mono md:border-b-0 md:border-r">
                npm run lint
              </code>
              <code className="bg-muted/40 px-5 py-3 text-xs font-mono">npm run build</code>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-5 py-3 text-xs">
              <span className="text-muted-foreground">
                Keep roadmap architecture. Do not invent backend endpoints. Preserve Human
                Verification Gate.
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                AWAITING HUMAN VERIFICATION
              </span>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-5xl flex-wrap gap-3 text-xs text-muted-foreground">
            <span>
              F03 implemented — see /shell · /dashboard · /platform · /store.
            </span>
            <span aria-hidden>·</span>
            <span>Next → F04 API client (no fake endpoints).</span>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container-pulse flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 PulseOps — Frontend foundation (F01). Not a product release.</span>
          <span className="inline-flex items-center gap-1.5">
            Built with <span className="h-1.5 w-1.5 rounded-full bg-primary" /> App Router
          </span>
        </div>
      </footer>
    </div>
  );
}

