"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "block" | "text" | "circle" | "card";
}

function Skeleton({ className, variant = "block", ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-busy="true"
      aria-live="polite"
      suppressHydrationWarning
      className={cn(
        "bg-accent animate-pulse motion-reduce:animate-none",
        variant === "block" && "rounded-md",
        variant === "text" && "h-4 rounded-full",
        variant === "circle" && "rounded-full",
        variant === "card" && "rounded-xl",
        !variant && "rounded-md",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonCompat({ className, variant = "block", ...props }: SkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      data-slot="skeleton"
      suppressHydrationWarning
      className={cn(
        "animate-pulse bg-muted motion-reduce:animate-none",
        variant === "block" && "rounded-md",
        variant === "text" && "h-4 rounded-full",
        variant === "circle" && "rounded-full",
        variant === "card" && "rounded-xl",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonCompat key={i} variant="text" className={cn(i === lines - 1 && "w-3/4")} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full rounded-xl border bg-card p-4">
      <div className="mb-4 flex gap-2">
        <SkeletonCompat className="h-9 flex-1" />
        <SkeletonCompat className="h-9 w-24" />
      </div>
      <div className="space-y-3">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonCompat key={i} className="h-4" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonCompat key={c} className="h-5" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export { Skeleton };
