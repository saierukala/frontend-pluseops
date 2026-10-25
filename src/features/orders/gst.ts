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

/** The single rate an order's taxed lines used, or null when lines carry different rates (Phase 38). */
export function orderLinesRate(order: { items?: Array<{ tax: string; gstRatePercent?: string }>; metadata?: Record<string, unknown> | null }): number | null {
  const rates = new Set((order.items ?? []).filter((i) => Number(i.tax) > 0 && i.gstRatePercent !== undefined).map((i) => Number(i.gstRatePercent)));
  if (rates.size === 1) return [...rates][0];
  if (rates.size === 0) return orderGstRate(order.metadata);
  return null;
}

/** "CGST ₹25.00 · SGST ₹25.00" or "IGST ₹50.00", for the line under the GST total. */
export function gstSplit(order: { supplyType?: "INTRA" | "INTER" | null; cgstTotal?: string; sgstTotal?: string; igstTotal?: string }, money: (v: string) => string): string | null {
  if (!order.supplyType) return null;
  if (order.supplyType === "INTER") return Number(order.igstTotal) ? `IGST ${money(order.igstTotal ?? "0")}` : null;
  return Number(order.cgstTotal) || Number(order.sgstTotal) ? `CGST ${money(order.cgstTotal ?? "0")} · SGST ${money(order.sgstTotal ?? "0")}` : null;
}

/** "GST (18%)", or plain "GST" when the rate isn't known. */
export function gstLabel(rate: number | null | undefined): string {
  return typeof rate === "number" ? `GST (${rate}%)` : "GST";
}
