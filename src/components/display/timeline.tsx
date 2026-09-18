"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: Date | string | number;
  icon?: React.ReactNode;
  status?: "completed" | "current" | "upcoming" | "error";
}

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  items: TimelineItem[];
  orientation?: "vertical" | "horizontal";
}

export function Timeline({ className, items, orientation = "vertical", ...props }: TimelineProps) {
  if (orientation === "horizontal") {
    return (
      <div className={cn("flex gap-4 overflow-x-auto py-4", className)} {...props}>
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-4 shrink-0">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium",
                  item.status === "completed" && "bg-primary border-primary text-primary-foreground",
                  item.status === "current" && "bg-background border-primary text-primary animate-pulse",
                  item.status === "upcoming" && "bg-muted border-border text-muted-foreground",
                  item.status === "error" && "bg-destructive border-destructive text-destructive-foreground"
                )}
                aria-hidden
              >
                {item.icon ?? (item.status === "completed" ? "✓" : idx + 1)}
              </span>
              <span className="mt-2 text-xs font-medium text-center max-w-[120px] leading-tight">{item.title}</span>
            </div>
            {idx < items.length - 1 ? <span className="h-0.5 w-8 bg-border shrink-0" aria-hidden /> : null}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("relative flex flex-col", className)} {...props}>
      {items.map((item, idx) => (
        <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
          {/* line */}
          {idx < items.length - 1 ? (
            <span className="absolute left-4 top-8 h-full w-px bg-border" aria-hidden />
          ) : null}
          <span
            className={cn(
              "relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-background text-xs font-medium",
              item.status === "completed" && "bg-primary border-primary text-primary-foreground",
              item.status === "current" && "border-primary text-primary bg-background",
              item.status === "upcoming" && "border-border text-muted-foreground",
              item.status === "error" && "bg-destructive border-destructive text-destructive-foreground"
            )}
            aria-hidden
          >
            {item.icon ?? (item.status === "completed" ? "✓" : idx + 1)}
          </span>
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-sm font-medium leading-none">{item.title}</p>
            {item.description ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.description}</p> : null}
            {item.timestamp ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {typeof item.timestamp === "string" || typeof item.timestamp === "number"
                  ? new Date(item.timestamp).toLocaleString()
                  : item.timestamp.toLocaleString()}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
