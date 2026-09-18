/**
 * Products — F04
 * Handoff §3: POST /products, GET /products, GET /products/:id, PATCH /products/:id, DELETE /products/:id,
 *             POST /products/:productId/categories, GET /products/:productId/categories
 */

import { apiClient } from "../client";
import type { Product, Category } from "../types";
import type { QueryParams } from "../query";

export interface ProductsQuery extends QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sku?: string;
  barcode?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const productsApi = {
  create(body: {
    name: string;
    description?: string;
    brand?: string;
    status?: Product["status"];
    basePrice?: string;
    categories?: string[];
    primaryCategoryId?: string;
  }): Promise<Product> {
    return apiClient.post<Product>("/products", body);
  },

  list(params?: ProductsQuery): Promise<Product[]> {
    return apiClient.get<Product[]>("/products", { params: params as Record<string, unknown> });
  },

  listEnvelope(params?: ProductsQuery) {
    return apiClient.requestEnvelope<Product[]>("/products", { params: params as Record<string, unknown> });
  },

  getById(id: string): Promise<Product> {
    return apiClient.get<Product>(`/products/${id}`);
  },

  update(id: string, body: Partial<{ name: string; description?: string; brand?: string; status?: Product["status"]; basePrice?: string | null }>): Promise<Product> {
    return apiClient.patch<Product>(`/products/${id}`, body);
  },

  remove(id: string): Promise<Product> {
    return apiClient.del<Product>(`/products/${id}`);
  },

  setCategories(productId: string, body: { categories: string[]; primaryCategoryId?: string }): Promise<Category[]> {
    return apiClient.post<Category[]>(`/products/${productId}/categories`, body);
  },

  getCategories(productId: string): Promise<Category[]> {
    return apiClient.get<Category[]>(`/products/${productId}/categories`);
  },
};
