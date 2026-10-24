import { formatDistanceToNowStrict } from "date-fns";

/**
 * Display helpers. Money arrives from the API as decimal strings ("59", "276.38"); these only
 * format for display — totals, taxes and refunds are always computed server-side.
 */

const moneyFormatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(value: string | number | null | undefined, currency = "USD", opts: { compact?: boolean } = {}): string {
  if (value === null || value === undefined || value === "") return "—";
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return String(value);
  const key = `${currency}:${opts.compact ? "c" : "f"}`;
  let fmt = moneyFormatters.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      ...(opts.compact ? { notation: "compact", maximumFractionDigits: 1 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });
    moneyFormatters.set(key, fmt);
  }
  return fmt.format(amount);
}

const numberFormat = new Intl.NumberFormat("en-US");
export function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : numberFormat.format(value);
}

/** Parses API timestamps; null for missing or unparseable values so formatters never throw. */
function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export function formatDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? dateFormat.format(d) : "—";
}

export function formatDateTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? dateTimeFormat.format(d) : "—";
}

export function formatRelative(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? `${formatDistanceToNowStrict(d)} ago` : "—";
}

export function initials(first?: string | null, last?: string | null, fallback = "?"): string {
  const value = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
  return value || fallback;
}

export function fullName(person: { firstName?: string | null; lastName?: string | null } | null | undefined): string {
  if (!person) return "—";
  return [person.firstName, person.lastName].filter(Boolean).join(" ") || "—";
}

/** "PARTIALLY_REFUNDED" -> "Partially refunded" */
export function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  const text = value.replace(/[_:-]+/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function shortId(id: string | null | undefined): string {
  return id ? id.slice(0, 8).toUpperCase() : "—";
}
