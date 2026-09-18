/**
 * Categories — F04
 * Handoff §3: POST /categories, GET /categories, PATCH /categories/:id, DELETE /categories/:id
 */

import { apiClient } from "../client";
import type { Category } from "../types";
import type { QueryParams } from "../query";

export interface CategoryCreateBody {
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export const categoriesApi = {
  create(body: CategoryCreateBody): Promise<Category> {
    return apiClient.post<Category>("/categories", body);
  },
  list(params?: QueryParams): Promise<Category[]> {
    return apiClient.get<Category[]>("/categories", { params: params as Record<string, unknown> });
  },
  listEnvelope(params?: QueryParams) {
    return apiClient.requestEnvelope<Category[]>("/categories", { params: params as Record<string, unknown> });
  },
  update(id: string, body: Partial<CategoryCreateBody>): Promise<Category> {
    return apiClient.patch<Category>(`/categories/${id}`, body);
  },
  remove(id: string): Promise<Category> {
    return apiClient.del<Category>(`/categories/${id}`);
  },
};
