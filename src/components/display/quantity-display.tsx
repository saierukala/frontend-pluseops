"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatQuantity } from "@/lib/utils";

export interface QuantityDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  unit?: string;
  size?: "sm" | "md" | "lg";
  status?: "default" | "low" | "out" | "high";
}

const statusStyles: Record<string, string> = {
  default: "text-foreground",
  low: "text-amber-700 dark:text-amber-300",
  out: "text-destructive",
  high: "text-emerald-700 dark:text-emerald-300",
};

export function QuantityDisplay({
  className,
  value,
  unit,
  size = "md",
  status = "default",
  ...props
}: QuantityDisplayProps) {
  return (
    <span
      className={cn(
        "tabular-nums font-medium",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        size === "lg" && "text-base font-semibold",
        statusStyles[status],
        className
      )}
      {...props}
    >
      {formatQuantity(value, unit)}
    </span>
  );
}
