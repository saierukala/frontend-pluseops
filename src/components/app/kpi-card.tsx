import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  loading?: boolean;
  tone?: "default" | "warning" | "success";
  className?: string;
}) {
  return (
    <Card className={cn("gap-3 p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon ? (
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground",
              tone === "warning" && "border-warning/30 bg-warning/10 text-warning",
              tone === "success" && "border-success/30 bg-success/10 text-success"
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-28" />
      ) : (
        <div className="tabular text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{value}</div>
      )}
      {hint ? <div className="text-xs text-muted-foreground">{loading ? <Skeleton className="h-3 w-24" /> : hint}</div> : null}
    </Card>
  );
}
