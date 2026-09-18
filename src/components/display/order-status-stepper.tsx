"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderStatusStepperProps extends React.HTMLAttributes<HTMLDivElement> {
  current: OrderStatus;
  statuses?: readonly string[];
  variant?: "horizontal" | "vertical";
}

export function OrderStatusStepper({
  className,
  current,
  statuses = ORDER_STATUSES,
  variant = "horizontal",
  ...props
}: OrderStatusStepperProps) {
  const currentIndex = statuses.indexOf(current);

  if (variant === "vertical") {
    return (
      <div className={cn("flex flex-col", className)} {...props} role="list" aria-label="Order status">
        {statuses.map((status, idx) => {
          const state = idx < currentIndex ? "completed" : idx === currentIndex ? "current" : "upcoming";
          return (
            <div key={status} className="relative flex gap-3 pb-6 last:pb-0" role="listitem" aria-current={state === "current" ? "step" : undefined}>
              {idx < statuses.length - 1 ? <span className={cn("absolute left-[15px] top-8 h-full w-0.5", state === "completed" ? "bg-primary" : "bg-border")} aria-hidden /> : null}
              <span
                className={cn(
                  "relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  state === "completed" && "bg-primary border-primary text-primary-foreground",
                  state === "current" && "bg-background border-primary text-primary ring-4 ring-primary/15",
                  state === "upcoming" && "bg-muted border-border text-muted-foreground"
                )}
              >
                {state === "completed" ? "✓" : idx + 1}
              </span>
              <span className={cn("pt-1 text-sm font-medium", state === "current" ? "text-foreground" : state === "completed" ? "text-foreground" : "text-muted-foreground")}>
                {status}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto py-2", className)} {...props} role="list" aria-label="Order status">
      {statuses.map((status, idx) => {
        const state = idx < currentIndex ? "completed" : idx === currentIndex ? "current" : "upcoming";
        return (
          <React.Fragment key={status}>
            <div role="listitem" aria-current={state === "current" ? "step" : undefined} className="flex flex-col items-center gap-2 shrink-0">
              <span
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold",
                  state === "completed" && "bg-primary border-primary text-primary-foreground",
                  state === "current" && "bg-background border-primary text-primary ring-4 ring-primary/15",
                  state === "upcoming" && "bg-muted border-border text-muted-foreground"
                )}
              >
                {state === "completed" ? "✓" : idx + 1}
              </span>
              <span className={cn("text-xs font-semibold whitespace-nowrap", state === "upcoming" ? "text-muted-foreground" : "text-foreground")}>{status}</span>
            </div>
            {idx < statuses.length - 1 ? (
              <span className={cn("h-0.5 w-8 shrink-0 rounded", idx < currentIndex ? "bg-primary" : "bg-border")} aria-hidden />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
