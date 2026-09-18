"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: { value: string; direction: "up" | "down" | "neutral"; hint?: string };
  footer?: React.ReactNode;
  loading?: boolean;
}

export function MetricCard({
  className,
  label,
  value,
  subValue,
  icon,
  trend,
  footer,
  loading,
  ...props
}: MetricCardProps) {
  if (loading) {
    return (
      <div className={cn("rounded-xl border bg-card p-5 shadow-xs", className)} {...props}>
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-8 w-28 rounded bg-muted" />
          <div className="h-3 w-32 rounded bg-muted" />
        </div>
      </div>
    );
  }
  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-xs", className)} {...props}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {subValue ? <p className="mt-1 text-sm text-muted-foreground">{subValue}</p> : null}
        </div>
        {icon ? <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span> : null}
      </div>
      {trend ? (
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium",
              trend.direction === "up" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
              trend.direction === "down" && "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
              trend.direction === "neutral" && "bg-muted text-muted-foreground"
            )}
          >
            {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {trend.value}
          </span>
          {trend.hint ? <span className="text-muted-foreground">{trend.hint}</span> : null}
        </div>
      ) : null}
      {footer ? <div className="mt-4 border-t pt-4 text-xs text-muted-foreground">{footer}</div> : null}
    </div>
  );
}
