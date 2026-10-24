import { cn } from "@/lib/utils";
import { humanize } from "@/lib/format";

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "brand";

const TONES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border [--dot:var(--muted-foreground)]",
  info: "bg-info/10 text-info border-info/20 [--dot:var(--info)]",
  success: "bg-success/10 text-success border-success/20 [--dot:var(--success)]",
  warning: "bg-warning/12 text-[color-mix(in_oklch,var(--warning)_75%,var(--foreground))] border-warning/25 [--dot:var(--warning)]",
  danger: "bg-destructive/10 text-destructive border-destructive/20 [--dot:var(--destructive)]",
  brand: "bg-primary/10 text-primary border-primary/20 [--dot:var(--primary)]",
};

const STATUS_TONES: Record<string, Tone> = {
  // orders
  DRAFT: "neutral",
  PENDING: "warning",
  CONFIRMED: "info",
  PROCESSING: "brand",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "neutral",
  REFUNDED: "danger",
  PARTIALLY_REFUNDED: "warning",
  // payments
  COMPLETED: "success",
  FAILED: "danger",
  // catalog / users / tenants
  ACTIVE: "success",
  INACTIVE: "neutral",
  ARCHIVED: "neutral",
  SUSPENDED: "danger",
  TRIAL: "info",
  // notifications
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "danger",
  // audit
  CREATE: "success",
  UPDATE: "info",
  DELETE: "danger",
  LOGIN: "brand",
  LOGOUT: "neutral",
};

export function StatusPill({ status, tone, label, className }: { status?: string | null; tone?: Tone; label?: string; className?: string }) {
  const resolved = tone ?? STATUS_TONES[status ?? ""] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-xs font-medium",
        TONES[resolved],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-[var(--dot)]" aria-hidden />
      {label ?? humanize(status)}
    </span>
  );
}
