"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge, type BadgeProps } from "@/components/ui/badge";

export type StatusKind =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "paid"
  | "failed"
  | "active"
  | "inactive"
  | "low_stock"
  | "out_of_stock"
  | "in_stock"
  | "draft"
  | "published"
  | "archived";

const statusConfig: Record<StatusKind, { label: string; variant: BadgeProps["variant"]; dot?: boolean }> = {
  pending: { label: "Pending", variant: "warning", dot: true },
  confirmed: { label: "Confirmed", variant: "info", dot: true },
  processing: { label: "Processing", variant: "info", dot: true },
  shipped: { label: "Shipped", variant: "info", dot: true },
  delivered: { label: "Delivered", variant: "success", dot: true },
  cancelled: { label: "Cancelled", variant: "destructive", dot: true },
  refunded: { label: "Refunded", variant: "secondary", dot: true },
  paid: { label: "Paid", variant: "success", dot: true },
  failed: { label: "Failed", variant: "destructive", dot: true },
  active: { label: "Active", variant: "success", dot: true },
  inactive: { label: "Inactive", variant: "secondary", dot: true },
  low_stock: { label: "Low stock", variant: "warning", dot: true },
  out_of_stock: { label: "Out of stock", variant: "destructive", dot: true },
  in_stock: { label: "In stock", variant: "success", dot: true },
  draft: { label: "Draft", variant: "secondary", dot: true },
  published: { label: "Published", variant: "success", dot: true },
  archived: { label: "Archived", variant: "outline", dot: true },
};

export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: StatusKind | string;
  variantOverride?: BadgeProps["variant"];
}

export function StatusBadge({ status, variantOverride, className, ...props }: StatusBadgeProps) {
  const normalized = status.toLowerCase() as StatusKind;
  const cfg = statusConfig[normalized];
  if (cfg) {
    return (
      <Badge variant={variantOverride ?? cfg.variant} dot={cfg.dot} className={cn("capitalize", className)} {...props}>
        {cfg.label}
      </Badge>
    );
  }
  // fallback — humanize
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <Badge variant={variantOverride ?? "secondary"} className={cn("capitalize", className)} {...props}>
      {label}
    </Badge>
  );
}
