/**
 * Analytics — F04
 * Handoff §3: GET /analytics/overview, /analytics/sales, /analytics/orders, /analytics/inventory, /analytics/customers, /analytics/revenue
 * Query: from/to (YYYY-MM-DD), groupBy day|week|month, plus resource filters; TTL 180s via x-cache.
 * Money values are decimal strings formatted by the server.
 */

import { apiClient } from "../client";
import type { QueryParams } from "../query";

export interface AnalyticsRange extends QueryParams {
  from?: string;
  to?: string;
  groupBy?: "day" | "week" | "month";
}

export interface AnalyticsOverview {
  orders: { total: number; byStatus: Record<string, number>; totalSales: string; avgOrderValue: string };
  sales: { totalOrders: number; totalSales: string; avgOrderValue: string };
  customers: { total: number };
  inventory: { totalQuantity: number; totalReserved: number; lowStockItems: number; warehouses: number; variants: number };
  products: { total: number; variants: number };
  revenue: { totalPayments: number; completedRevenue: string; totalRefunded: string; netRevenue: string };
  generatedAt: string;
}

export interface SalesBucket {
  bucket: string | null;
  orderCount: number;
  totalSales: string;
  avgValue: string;
}

export interface RevenueBucket {
  bucket: string | null;
  grossRevenue: string;
  totalRefunded: string;
  netRevenue: string;
  paymentCount: number;
}

export interface OrdersByStatus {
  status: string;
  count: number;
}

export interface TopCustomer {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  orderCount: number;
  totalSpent: string;
}

const get = <T>(path: string, params?: QueryParams) =>
  apiClient.requestEnvelope<T>(path, { params: params as Record<string, unknown> }).then((env) => env.data);

export const analyticsApi = {
  getOverview: (params?: AnalyticsRange) => get<AnalyticsOverview>("/analytics/overview", params),
  getSales: (params?: AnalyticsRange & { limit?: number }) => get<SalesBucket[]>("/analytics/sales", params),
  getRevenue: (params?: AnalyticsRange & { limit?: number }) => get<RevenueBucket[]>("/analytics/revenue", params),
  getOrders: (params?: AnalyticsRange) => get<OrdersByStatus[]>("/analytics/orders", params),
  getCustomers: (params?: AnalyticsRange & { limit?: number }) => get<TopCustomer[]>("/analytics/customers", params),
  getInventory: (params?: QueryParams) => get<unknown[]>("/analytics/inventory", params),
};
