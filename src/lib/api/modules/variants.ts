/**
 * Variants — F04
 * Handoff §3: POST /products/:productId/variants, GET ..., GET .../:variantId, PATCH ..., DELETE ...
 *           + PUT/GET /products/:productId/variants/:variantId/attributes
 */

import { apiClient } from "../client";
import type { ProductVariant } from "../types";
import type { QueryParams } from "../query";

export const variantsApi = {
  create(
    productId: string,
    body: { sku: string; barcode?: string | null; price: string; costPrice?: string | null; status?: ProductVariant["status"] }
  ): Promise<ProductVariant> {
    return apiClient.post<ProductVariant>(`/products/${productId}/variants`, body);
  },

  list(productId: string, params?: QueryParams): Promise<ProductVariant[]> {
    return apiClient.get<ProductVariant[]>(`/products/${productId}/variants`, {
      params: params as Record<string, unknown>,
    });
  },

  listEnvelope(productId: string, params?: QueryParams) {
    return apiClient.requestEnvelope<ProductVariant[]>(`/products/${productId}/variants`, {
      params: params as Record<string, unknown>,
    });
  },

  getById(productId: string, variantId: string): Promise<ProductVariant> {
    return apiClient.get<ProductVariant>(`/products/${productId}/variants/${variantId}`);
  },

  update(
    productId: string,
    variantId: string,
    body: Partial<{ sku: string; barcode?: string | null; price: string; costPrice?: string | null; status: ProductVariant["status"] }>
  ): Promise<ProductVariant> {
    return apiClient.patch<ProductVariant>(`/products/${productId}/variants/${variantId}`, body);
  },

  remove(productId: string, variantId: string): Promise<ProductVariant> {
    return apiClient.del<ProductVariant>(`/products/${productId}/variants/${variantId}`);
  },

  getAttributes(
    productId: string,
    variantId: string
  ): Promise<Array<{ attributeDefinitionId: string; value: string }>> {
    return apiClient.get<Array<{ attributeDefinitionId: string; value: string }>>(
      `/products/${productId}/variants/${variantId}/attributes`
    );
  },

  setAttributes(
    productId: string,
    variantId: string,
    body: { attributes: Array<{ attributeDefinitionId: string; value: string }> }
  ): Promise<Array<{ attributeDefinitionId: string; value: string }>> {
    return apiClient.put<Array<{ attributeDefinitionId: string; value: string }>>(
      `/products/${productId}/variants/${variantId}/attributes`,
      body
    );
  },
};
