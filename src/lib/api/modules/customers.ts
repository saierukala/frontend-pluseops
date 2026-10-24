/**
 * Customers — order buyers within a tenant
 * GET/POST /customers, GET/PATCH/DELETE /customers/:id (soft delete, email unique per active customer),
 * GET /customers/:id/orders, addresses under /customers/:id/addresses
 */

import { apiClient } from "../client";
import type { QueryParams } from "../query";
import type { Order } from "./orders";

export interface Customer {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  metadata: Record<string, unknown>;
  /** Set when the customer has a storefront account. */
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  addresses?: CustomerAddress[];
}

export interface CustomerAddress {
  id: string;
  type: "SHIPPING" | "BILLING";
  label?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  isDefault: boolean;
}

export interface CustomerBody {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export const customersApi = {
  listEnvelope(params?: QueryParams) {
    return apiClient.requestEnvelope<Customer[]>("/customers", { params: params as Record<string, unknown> });
  },
  listOrdersEnvelope(id: string, params?: QueryParams) {
    return apiClient.requestEnvelope<Order[]>(`/customers/${id}/orders`, { params: params as Record<string, unknown> });
  },
  getById(id: string): Promise<Customer> {
    return apiClient.get<Customer>(`/customers/${id}`);
  },
  create(body: CustomerBody): Promise<Customer> {
    return apiClient.post<Customer>("/customers", body);
  },
  update(id: string, body: Partial<Omit<CustomerBody, "phone">> & { phone?: string | null }): Promise<Customer> {
    return apiClient.patch<Customer>(`/customers/${id}`, body);
  },
  remove(id: string): Promise<null> {
    return apiClient.del<null>(`/customers/${id}`);
  },
};
