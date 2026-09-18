/**
 * Warehouses — F04
 * Handoff §3: POST /warehouses, GET /warehouses, GET /warehouses/:id, PATCH /warehouses/:id, DELETE /warehouses/:id
 */

import { apiClient } from "../client";
import type { Warehouse } from "../types";
import type { QueryParams } from "../query";

export interface WarehouseCreateBody {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export const warehousesApi = {
  create(body: WarehouseCreateBody): Promise<Warehouse> {
    return apiClient.post<Warehouse>("/warehouses", body);
  },
  list(params?: QueryParams): Promise<Warehouse[]> {
    return apiClient.get<Warehouse[]>("/warehouses", { params: params as Record<string, unknown> });
  },
  listEnvelope(params?: QueryParams) {
    return apiClient.requestEnvelope<Warehouse[]>("/warehouses", { params: params as Record<string, unknown> });
  },
  getById(id: string): Promise<Warehouse> {
    return apiClient.get<Warehouse>(`/warehouses/${id}`);
  },
  update(id: string, body: Partial<WarehouseCreateBody>): Promise<Warehouse> {
    return apiClient.patch<Warehouse>(`/warehouses/${id}`, body);
  },
  remove(id: string): Promise<Warehouse> {
    return apiClient.del<Warehouse>(`/warehouses/${id}`);
  },
};
