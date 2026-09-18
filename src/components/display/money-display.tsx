"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

export interface MoneyDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number;
  currency?: string;
  locale?: string;
  compact?: boolean;
  showCurrency?: boolean;
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
}

const sizeClasses: Record<string, string> = {
  sm: "text-sm font-medium",
  md: "text-base font-semibold",
  lg: "text-xl font-bold tracking-tight",
};

export function MoneyDisplay({
  className,
  amount,
  currency = "INR",
  locale = "en-IN",
  compact = false,
  showCurrency = true,
  size = "md",
  align = "left",
  ...props
}: MoneyDisplayProps) {
  const formatted = React.useMemo(() => {
    if (compact) {
      const abs = Math.abs(amount);
      if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
      if (abs >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    }
    if (showCurrency) return formatCurrency(amount, currency, locale);
    try {
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(amount);
    } catch {
      return amount.toFixed(2);
    }
  }, [amount, currency, locale, compact, showCurrency]);

  return (
    <span className={cn("tabular-nums", sizeClasses[size], align === "right" && "text-right", className)} {...props}>
      {formatted}
    </span>
  );
}
