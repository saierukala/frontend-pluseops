"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function ShellPlaceholder({
  title,
  description,
  route,
  shell,
  backendNote,
  nextSteps,
}: {
  title: string;
  description: string;
  route: string;
  shell: "Tenant" | "Platform" | "Storefront";
  backendNote?: string;
  nextSteps?: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={shell === "Platform" ? "default" : shell === "Storefront" ? "secondary" : "outline"}>{shell} shell</Badge>
            <Badge variant="info" size="sm">
              {route}
            </Badge>
            <span className="rounded-full border bg-muted px-2.5 py-1 text-xs font-medium">F03 — placeholder</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2">
          <Link href={"/shell" as unknown as never} className="inline-flex h-9 items-center rounded-lg border bg-card px-3 text-sm font-medium shadow-xs hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">Shell overview</Link>
          <Link href={"/design-system" as unknown as never} className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-xs hover:bg-[var(--primary-hover)] focus-visible:ring-2 focus-visible:ring-ring">Design system</Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>What lives here next</CardTitle>
            <CardDescription>This route is wired through the {shell} layout. Future phases will mount real features here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              F03 establishes navigation and layout structure only. No feature business logic, no API calls, and no fake data fetching. The shell proves responsive behavior, active navigation state, keyboard accessibility, and visual hierarchy.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Sidebar + topbar (desktop) → drawer + bottom nav (mobile)</li>
              <li>Active state driven by <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">usePathname()</code></li>
              <li>Search, notifications, and user menu are UI-only in F03</li>
              <li>Content area uses max-width container with consistent padding</li>
            </ul>
            {backendNote ? <Alert variant="warning" title="Backend dependency">{backendNote}</Alert> : <Alert variant="success" title="Backend ready (future)">When the feature phase lands, this page will connect to real backend endpoints via the F04 API client.</Alert>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Navigate the shell</CardTitle>
            <CardDescription>Verify sidebar, topbar, and mobile behavior.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {(nextSteps ?? []).map((s) => (
              <Link key={s.href} href={s.href as unknown as never} className="inline-flex h-9 items-center justify-center rounded-lg border bg-card px-3 text-sm font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
                {s.label}
              </Link>
            ))}
            {!nextSteps?.length ? <p className="text-sm text-muted-foreground">Use the sidebar to explore peer routes in this workspace.</p> : null}
            <div className="mt-2 rounded-lg border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
              <div className="font-medium text-foreground">Checklist</div>
              375px • 768px • 1024px • 1280px · light/dark · Tab focus · Esc closes menus · No horizontal overflow
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empty / content area behavior</CardTitle>
          <CardDescription>The shell keeps content spacing consistent while features decide their own empty and loading states.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border bg-card">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <div className="mt-3 text-sm font-semibold">No feature data yet</div>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">This placeholder proves the shell&apos;s content area handles empty states without giant cards or random colors.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled>Primary action (future)</Button>
              <Button variant="ghost" size="sm" disabled>Secondary (future)</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

