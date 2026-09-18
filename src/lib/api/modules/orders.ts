/**
 * Orders — F04
 * Handoff §3: POST /orders, GET /orders, GET /orders/:id, PATCH /orders/:id/status, POST /orders/:id/cancel, GET /orders/:id/history
 */

import { apiClient } from "../client";
import type { QueryParams } from "../query";

export interface Order {
  id: string;
  tenantId: string;
  customerId: string;
  status: string;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  shippingTotal: string;
  total: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusHistory {
  id: string;
  tenantId: string;
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
  reason?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export const ordersApi = {
  create(body: {
    customerId: string;
    items: Array<{
      productVariantId: string;
      warehouseId: string;
      quantity: number;
      discount?: string;
      tax?: string;
    }>;
    shippingTotal?: string;
    currency?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Order> {
    return apiClient.post<Order>("/orders", body);
  },

  list(params?: QueryParams): Promise<Order[]> {
    return apiClient.get<Order[]>("/orders", { params: params as Record<string, unknown> });
  },

  listEnvelope(params?: QueryParams) {
    return apiClient.requestEnvelope<Order[]>("/orders", { params: params as Record<string, unknown> });
  },

  getById(id: string): Promise<Order> {
    return apiClient.get<Order>(`/orders/${id}`);
  },

  updateStatus(id: string, body: { status: string; reason?: string }): Promise<Order> {
    return apiClient.patch<Order>(`/orders/${id}/status`, body);
  },

  cancel(id: string, body?: { reason?: string }): Promise<Order> {
    return apiClient.post<Order>(`/orders/${id}/cancel`, body ?? {});
  },

  getHistory(id: string, params?: QueryParams): Promise<OrderStatusHistory[]> {
    return apiClient.get<OrderStatusHistory[]>(`/orders/${id}/history`, {
      params: params as Record<string, unknown>,
    });
  },

  getHistoryEnvelope(id: string, params?: QueryParams) {
    return apiClient.requestEnvelope<OrderStatusHistory[]>(`/orders/${id}/history`, {
      params: params as Record<string, unknown>,
    });
  },
};
