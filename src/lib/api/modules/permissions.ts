/**
 * Permissions — F04
 * Handoff §3: GET /permissions, GET /permissions/:id (no pagination)
 */

import { apiClient } from "../client";
import type { Permission } from "../types";

export const permissionsApi = {
  list(): Promise<Permission[]> {
    return apiClient.get<Permission[]>("/permissions");
  },
  getById(id: string): Promise<Permission> {
    return apiClient.get<Permission>(`/permissions/${id}`);
  },
};
