import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — class name merger for design system
 * Uses clsx for conditional handling + tailwind-merge for Tailwind conflict resolution.
 * Backward-compatible with existing PulseOps usage:
 *   cn("a", { b: true }, ["c"], "d")
 * Caller should put overrides last — twMerge resolves conflicts deterministically.
 */
export type { ClassValue };

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format currency with Intl, safe fallback */
export function formatCurrency(
  value: number,
  currency = "INR",
  locale = "en-IN"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatDate(
  value: Date | string | number,
  opts?: Intl.DateTimeFormatOptions,
  locale = "en-IN"
): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...opts,
  }).format(d);
}

export function formatQuantity(value: number, unit?: string): string {
  const formatted = new Intl.NumberFormat("en-IN").format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}
