/**
 * Payments — F04
 * Handoff §3: GET /payments, POST /payments/create, POST /payments/confirm, GET /payments/:id, POST /payments/:id/refund
 * Note: POST /payments/webhook is provider-only (HMAC) — not exposed to frontend.
 * Amounts are always server-derived decimal strings — never send or compute them client-side.
 */

import { apiClient } from "../client";
import type { QueryParams } from "../query";

export type PaymentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED" | "PARTIALLY_REFUNDED";

export interface PaymentTransaction {
  id: string;
  type: string;
  amount: string;
  currency: string;
  status: string;
  providerTransactionId?: string | null;
  createdAt: string;
}

export interface Refund {
  id: string;
  amount: string;
  status: string;
  reason?: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  orderId: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  provider?: string | null;
  providerPaymentId?: string | null;
  createdAt: string;
  updatedAt: string;
  transactions?: PaymentTransaction[];
  refunds?: Refund[];
  order?: {
    id: string;
    total: string;
    status: string;
    currency: string;
    customer?: { id: string; email: string; firstName: string; lastName: string };
  };
}

export const paymentsApi = {
  listEnvelope(params?: QueryParams) {
    return apiClient.requestEnvelope<Payment[]>("/payments", { params: params as Record<string, unknown> });
  },

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
