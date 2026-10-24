"use client";

import * as React from "react";
import { useQueries } from "@tanstack/react-query";
import { Activity, Database, Layers, RefreshCw, Server } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { StatusPill } from "@/components/app/status-pill";
import { healthApi } from "@/lib/api/modules/health";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/format";

const CHECKS: Array<{ key: string; label: string; description: string; icon: LucideIcon; probe: () => Promise<unknown>; required: boolean }> = [
  { key: "api", label: "API", description: "Process liveness (no dependencies)", icon: Server, probe: healthApi.getHealth, required: true },
  { key: "db", label: "PostgreSQL", description: "Primary database — SELECT 1", icon: Database, probe: healthApi.getHealthDb, required: true },
  { key: "redis", label: "Redis", description: "Cache, rate limits and sessions", icon: Activity, probe: healthApi.getHealthRedis, required: false },
  { key: "bullmq", label: "Background jobs", description: "BullMQ queues and workers", icon: Layers, probe: healthApi.getHealthBullmq, required: false },
];

/** A probe that answers 503 is "down"; one that can't be reached at all is "unreachable". */
async function runProbe(probe: () => Promise<unknown>) {
  const started = performance.now();
  try {
    await probe();
    return { status: "up" as const, latency: Math.round(performance.now() - started) };
  } catch (error) {
    return { status: error instanceof ApiError && error.status === 503 ? ("down" as const) : ("unreachable" as const), latency: Math.round(performance.now() - started) };
  }
}

export default function SystemHealthPage() {
  const results = useQueries({
    queries: CHECKS.map((c) => ({ queryKey: ["system-health", c.key], queryFn: () => runProbe(c.probe), refetchInterval: 30_000 })),
  });
  const checkedAt = Math.max(...results.map((r) => r.dataUpdatedAt || 0));
  const allUp = results.every((r) => r.data?.status === "up");
  const requiredDown = results.some((r, i) => CHECKS[i].required && r.data && r.data.status !== "up");
  const refreshing = results.some((r) => r.isFetching);

  return (
    <PageBody>
      <PageHeader
        title="System health"
        description="Live status of PulseOps infrastructure. Probes refresh every 30 seconds."
        actions={
          <Button variant="outline" onClick={() => results.forEach((r) => r.refetch())} loading={refreshing}>
            <RefreshCw /> Check now
          </Button>
        }
      />

      <Card className={requiredDown ? "border-destructive/40" : allUp ? "border-success/30" : undefined}>
        <CardContent className="flex items-center gap-4">
          <span className={`relative flex size-3 ${requiredDown ? "text-destructive" : allUp ? "text-success" : "text-warning"}`}>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-40" />
            <span className="relative inline-flex size-3 rounded-full bg-current" />
          </span>
          <div className="flex-1">
            <p className="font-semibold">{results.some((r) => r.isLoading) ? "Checking systems…" : requiredDown ? "Major outage" : allUp ? "All systems operational" : "Degraded performance"}</p>
            <p className="text-sm text-muted-foreground">{checkedAt ? `Last checked ${formatDateTime(new Date(checkedAt))}` : "—"}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {CHECKS.map((c, i) => {
          const r = results[i];
          const Icon = c.icon;
          return (
            <Card key={c.key}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {c.label}
                      {!c.required ? <span className="text-xs font-normal text-muted-foreground">optional</span> : null}
                    </CardTitle>
                    <CardDescription>{c.description}</CardDescription>
                  </div>
                  {r.data ? (
                    <StatusPill tone={r.data.status === "up" ? "success" : c.required ? "danger" : "warning"} label={r.data.status === "up" ? "Operational" : r.data.status === "down" ? "Down" : "Unreachable"} />
                  ) : (
                    <Skeleton className="h-6 w-24 rounded-full" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between border-t pt-4 text-sm">
                <span className="text-muted-foreground">Response time</span>
                <span className="tabular font-medium">{r.data ? `${r.data.latency} ms` : "—"}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageBody>
  );
}
