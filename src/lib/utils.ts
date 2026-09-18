/**
 * cn — class name merger for design system
 * Lightweight without external deps: handles strings, conditional objects, arrays.
 * For Tailwind conflict resolution, ordering matters — caller should put overrides last.
 */
export type ClassValue =
  | string
  | boolean
  | null
  | undefined
  | number
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

function toVal(mix: ClassValue): string {
  if (typeof mix === "string" || typeof mix === "number") return String(mix);
  if (typeof mix === "object" && mix !== null) {
    if (Array.isArray(mix)) return mix.map(toVal).filter(Boolean).join(" ");
    // Record
    return Object.entries(mix)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k)
      .join(" ");
  }
  return "";
}

export function cn(...inputs: ClassValue[]): string {
  return inputs.map(toVal).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
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
