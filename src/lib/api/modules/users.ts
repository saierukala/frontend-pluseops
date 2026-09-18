/**
 * Users — F04
 * Handoff §3: GET /users, GET /users/:id, PATCH /users/:id, DELETE /users/:id
 *         + GET/POST /users/:id/roles
 */

import { apiClient } from "../client";
import type { User, Role } from "../types";
import type { QueryParams } from "../query";

export interface UsersQuery extends QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  roleId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const usersApi = {
  list(params?: UsersQuery): Promise<User[]> {
    return apiClient.get<User[]>("/users", { params: params as Record<string, unknown> });
  },

  listEnvelope(params?: UsersQuery) {
    return apiClient.requestEnvelope<User[]>("/users", { params: params as Record<string, unknown> });
  },

  getById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },

  update(id: string, body: Partial<{ firstName: string; lastName: string; status: string }>): Promise<User> {
    return apiClient.patch<User>(`/users/${id}`, body);
  },

  remove(id: string): Promise<null> {
    return apiClient.del<null>(`/users/${id}`);
  },

  getRoles(userId: string): Promise<Role[]> {
    return apiClient.get<Role[]>(`/users/${userId}/roles`);
  },

  assignRoles(userId: string, roleIds: string[]): Promise<Role[]> {
    return apiClient.post<Role[]>(`/users/${userId}/roles`, { roleIds });
  },
};
