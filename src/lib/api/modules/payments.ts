/**
 * Payments — F04
 * Handoff §3: POST /payments/create, POST /payments/confirm, GET /payments/:id, POST /payments/:id/refund
 * Note: POST /payments/webhook is provider-only (HMAC) — not exposed to frontend.
 */

import { apiClient } from "../client";

export interface Payment {
  id: string;
  tenantId: string;
  orderId: string;
  amount: string;
  currency: string;
  status: string;
  provider?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const paymentsApi = {
  create(body: { orderId: string; provider?: string; currency?: string; metadata?: Record<string, unknown> }): Promise<Payment> {
    return apiClient.post<Payment>("/payments/create", body);
  },

  confirm(body: { paymentId: string; providerPaymentId?: string; simulateFailure?: boolean }): Promise<Payment> {
    return apiClient.post<Payment>("/payments/confirm", body);
  },

  getById(id: string): Promise<Payment> {
    return apiClient.get<Payment>(`/payments/${id}`);
  },

  refund(id: string, body: { amount: string; reason?: string; metadata?: Record<string, unknown> }): Promise<Payment> {
    return apiClient.post<Payment>(`/payments/${id}/refund`, body);
  },
};
