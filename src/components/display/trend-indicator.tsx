"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TrendIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number | string;
  direction: "up" | "down" | "neutral";
  label?: string;
  size?: "sm" | "md";
}

export function TrendIndicator({ className, value, direction, label, size = "md", ...props }: TrendIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-xs",
        direction === "up" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
        direction === "down" && "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
        direction === "neutral" && "bg-muted text-muted-foreground",
        className
      )}
      {...props}
    >
      <span aria-hidden>{direction === "up" ? "↗" : direction === "down" ? "↘" : "→"}</span>
      {typeof value === "number" ? `${value > 0 ? "+" : ""}${value}%` : value}
      {label ? <span className="font-normal opacity-70">{label}</span> : null}
    </span>
  );
}
