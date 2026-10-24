/**
 * Customers — order buyers within a tenant
 * GET/POST /customers, GET/PATCH/DELETE /customers/:id (soft delete, email unique per tenant)
 */

import { apiClient } from "../client";
import type { QueryParams } from "../query";

export interface Customer {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  _count?: { orders: number };
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
