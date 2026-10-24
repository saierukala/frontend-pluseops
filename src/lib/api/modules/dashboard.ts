/**
 * Dashboard — F04
 * Handoff §3: GET /dashboard/overview (x-cache header, TTL 60s)
 * Each section is either its data or `{ error: true }` when that domain failed (partial results).
 */

import { apiClient } from "../client";

export interface SectionError {
  error: true;
  message: string;
  code: string;
}

export interface DashboardOverview {
  tenantId: string;
  generatedAt: string;
  orders: SectionError | {
    total: number;
    byStatus: Record<string, number>;
    revenueSum: string;
    recent: Array<{ id: string; status: string; total: string; currency: string; customerId: string; createdAt: string }>;
  };
  inventory: SectionError | { warehouses: number; variants: number; lowStockItems: number; totalQuantity: number };
  payments: SectionError | {
    total: number;
    byStatus: Record<string, number>;
    completedRevenue: string;
    recent: Array<{ id: string; orderId: string; amount: string; currency: string; status: string; createdAt: string }>;
  };
  users: SectionError | { total: number; byStatus: Record<string, number> };
  notifications: SectionError | { total: number; unread: number };
  products: SectionError | { products: number; categories: number; variants: number };
}

export function isSectionError(section: unknown): section is SectionError {
  return Boolean(section && typeof section === "object" && "error" in section);
}

export const dashboardApi = {
  getOverview(): Promise<DashboardOverview> {
    return apiClient.get<DashboardOverview>("/dashboard/overview");
  },
};
