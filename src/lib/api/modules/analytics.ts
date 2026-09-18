/**
 * Analytics — F04
 * Handoff §3: GET /analytics/overview, /analytics/sales, /analytics/orders, /analytics/inventory, /analytics/customers, /analytics/revenue
 * Query: from/to (YYYY-MM-DD), groupBy day|week|month, plus resource filters; TTL 180s via x-cache.
 */

import { apiClient } from "../client";
import type { QueryParams } from "../query";

export interface AnalyticsOverview {
  [key: string]: unknown;
}

export const analyticsApi = {
  getOverview(params?: QueryParams): Promise<AnalyticsOverview> {
    return apiClient.get<AnalyticsOverview>("/analytics/overview", { params: params as Record<string, unknown> });
  },
  getOverviewEnvelope(params?: QueryParams) {
    return apiClient.requestEnvelope<AnalyticsOverview>("/analytics/overview", {
      params: params as Record<string, unknown>,
    });
  },
  getSales(params?: QueryParams): Promise<unknown> {
    return apiClient.get<unknown>("/analytics/sales", { params: params as Record<string, unknown> });
  },
  getSalesEnvelope(params?: QueryParams) {
    return apiClient.requestEnvelope<unknown>("/analytics/sales", { params: params as Record<string, unknown> });
  },
  getOrders(params?: QueryParams): Promise<unknown> {
    return apiClient.get<unknown>("/analytics/orders", { params: params as Record<string, unknown> });
  },
  getInventory(params?: QueryParams): Promise<unknown> {
    return apiClient.get<unknown>("/analytics/inventory", { params: params as Record<string, unknown> });
  },
  getCustomers(params?: QueryParams): Promise<unknown> {
    return apiClient.get<unknown>("/analytics/customers", { params: params as Record<string, unknown> });
  },
  getRevenue(params?: QueryParams): Promise<unknown> {
    return apiClient.get<unknown>("/analytics/revenue", { params: params as Record<string, unknown> });
  },
};
