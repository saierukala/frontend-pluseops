/**
 * Tenants — F04 (public, no auth per handoff §3 Tenants)
 * POST /tenants, GET /tenants/:id, PATCH /tenants/:id, DELETE /tenants/:id
 * NOTE: GET /tenants list is BACKEND DEPENDENCY — not exposed.
 */

import { apiClient } from "../client";
import type { Tenant } from "../types";

export const tenantsApi = {
  create(body: { name: string; slug: string; status?: Tenant["status"]; plan?: string }): Promise<Tenant> {
    return apiClient.post<Tenant>("/tenants", body, { skipAuthRefresh: true });
  },
  getById(id: string): Promise<Tenant> {
    return apiClient.get<Tenant>(`/tenants/${id}`, { skipAuthRefresh: true });
  },
  update(id: string, body: Partial<{ name: string; slug: string; status: Tenant["status"]; plan: string }>): Promise<Tenant> {
    return apiClient.patch<Tenant>(`/tenants/${id}`, body, { skipAuthRefresh: true });
  },
  remove(id: string): Promise<null> {
    return apiClient.del<null>(`/tenants/${id}`, { skipAuthRefresh: true });
  },
};
