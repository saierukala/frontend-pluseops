"use client";

import { useQuery } from "@tanstack/react-query";
import { workspaceApi } from "@/lib/api/modules/tenants";
import { usePermission } from "@/lib/auth/permission-context";

/** Platform default when a workspace hasn't set its own rate (backend DEFAULT_GST_RATE_PERCENT). */
export const DEFAULT_GST_RATE_PERCENT = 18;

/** The workspace's GST rate, for previews only — the server computes the tax on every order. */
export function useGstRate(): number {
  const { hasPermission } = usePermission();
  const settings = useQuery({
    queryKey: ["workspace", "settings"],
    queryFn: () => workspaceApi.getSettings(),
    enabled: hasPermission("tenant:read"),
    staleTime: 5 * 60_000,
  });
  return settings.data?.gstRatePercent ?? DEFAULT_GST_RATE_PERCENT;
}

/** Rate recorded on an order (metadata.gstRatePercent), when the order was placed with GST. */
export function orderGstRate(metadata: Record<string, unknown> | null | undefined): number | null {
  const rate = metadata?.gstRatePercent;
  return typeof rate === "number" ? rate : null;
}

/** "GST (18%)", or plain "GST" when the rate isn't known. */
export function gstLabel(rate: number | null | undefined): string {
  return typeof rate === "number" ? `GST (${rate}%)` : "GST";
}
