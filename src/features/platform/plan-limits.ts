import type { PlanLimitKey } from "@/lib/api/modules/platform";
import { formatNumber } from "@/lib/format";

export const LIMIT_LABELS: Record<PlanLimitKey, string> = {
  users: "Users",
  products: "Products",
  warehouses: "Warehouses",
  ordersPerMonth: "Orders / month",
};
export const LIMIT_KEYS = Object.keys(LIMIT_LABELS) as PlanLimitKey[];

/** null = unlimited */
export function formatLimit(value: number | null | undefined) {
  return value == null ? "Unlimited" : formatNumber(value);
}
