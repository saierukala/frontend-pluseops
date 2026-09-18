/**
 * Roles — F04
 * Handoff §3: GET /roles, GET /roles/:id, POST /roles, PATCH /roles/:id, DELETE /roles/:id, POST /roles/:id/permissions
 */

import { apiClient } from "../client";
import type { Role, Permission } from "../types";
import type { QueryParams } from "../query";

export const rolesApi = {
  list(params?: QueryParams): Promise<Role[]> {
    return apiClient.get<Role[]>("/roles", { params: params as Record<string, unknown> });
  },
  listEnvelope(params?: QueryParams) {
    return apiClient.requestEnvelope<Role[]>("/roles", { params: params as Record<string, unknown> });
  },
  getById(id: string): Promise<Role> {
    return apiClient.get<Role>(`/roles/${id}`);
  },
  create(body: { name: string; description?: string }): Promise<Role> {
    return apiClient.post<Role>("/roles", body);
  },
  update(id: string, body: Partial<{ name: string; description?: string }>): Promise<Role> {
    return apiClient.patch<Role>(`/roles/${id}`, body);
  },
  remove(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.del<{ success: boolean; message: string }>(`/roles/${id}`);
  },
  assignPermissions(roleId: string, permissionIds: string[]): Promise<Permission[]> {
    return apiClient.post<Permission[]>(`/roles/${roleId}/permissions`, { permissionIds });
  },
};
