"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  trend?: { value: string; direction: "up" | "down" | "neutral"; label?: string };
  loading?: boolean;
}

export function StatCard({ className, label, value, hint, icon, trend, loading, ...props }: StatCardProps) {
  if (loading) {
    return (
      <div className={cn("rounded-xl border bg-card p-5 shadow-xs", className)} {...props}>
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-7 w-24 rounded bg-muted" />
          <div className="h-3 w-32 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-xs", className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {icon ? <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span> : null}
      </div>
      {trend ? (
        <div
          className={cn(
            "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            trend.direction === "up" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
            trend.direction === "down" && "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
            trend.direction === "neutral" && "bg-muted text-muted-foreground"
          )}
        >
          <span aria-hidden>
            {trend.direction === "up" ? "↗" : trend.direction === "down" ? "↘" : "→"}
          </span>
          {trend.value} {trend.label ? <span className="opacity-70">{trend.label}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
