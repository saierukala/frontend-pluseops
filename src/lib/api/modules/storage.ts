/**
 * Storage / Product Images — F04
 * Handoff §3: POST /products/:productId/images, GET .../images, PATCH .../images/:imageId, DELETE .../images/:imageId,
 *             POST .../variants/:variantId/images, GET .../variants/:variantId/images,
 *             GET /products/:productId/images/:imageId/file, GET .../signed-url,
 *             GET /storage/signed (HMAC public), GET /storage/file (Bearer tenant check)
 *
 * File endpoints are binary — use rawResponse/Blob handling.
 */

import { apiClient } from "../client";

export interface ProductImage {
  id: string;
  tenantId: string;
  productId: string;
  variantId?: string | null;
  storageKey: string;
  url?: string | null;
  altText?: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export const productImagesApi = {
  upload(productId: string, formData: FormData): Promise<ProductImage> {
    return apiClient.upload<ProductImage>(`/products/${productId}/images`, formData);
  },
  list(productId: string): Promise<ProductImage[]> {
    return apiClient.get<ProductImage[]>(`/products/${productId}/images`);
  },
  update(
    productId: string,
    imageId: string,
    body: Partial<{ altText?: string | null; sortOrder?: number; isPrimary?: boolean }>
  ): Promise<ProductImage> {
    return apiClient.patch<ProductImage>(`/products/${productId}/images/${imageId}`, body);
  },
  remove(productId: string, imageId: string): Promise<ProductImage> {
    return apiClient.del<ProductImage>(`/products/${productId}/images/${imageId}`);
  },

  uploadVariant(productId: string, variantId: string, formData: FormData): Promise<ProductImage> {
    return apiClient.upload<ProductImage>(`/products/${productId}/variants/${variantId}/images`, formData);
  },
  listVariant(productId: string, variantId: string): Promise<ProductImage[]> {
    return apiClient.get<ProductImage[]>(`/products/${productId}/variants/${variantId}/images`);
  },
};

export interface SignedUrlResponse {
  url: string;
  expiresAt: string;
  key: string;
}

export const storageApi = {
  getSignedUrl(productId: string, imageId: string): Promise<SignedUrlResponse> {
    return apiClient.get<SignedUrlResponse>(`/products/${productId}/images/${imageId}/signed-url`);
  },

  /**
   * Binary file stream — returns Blob via raw fetch. Uses central client's
   * Authorization + request-id handling but bypasses JSON envelope.
   * Callers can create object URLs from the Blob.
   */
  async getFileBlob(productId: string, imageId: string): Promise<Blob> {
    const envelope = await apiClient.requestEnvelope<Blob>(`/products/${productId}/images/${imageId}/file`, {
      method: "GET",
      rawResponse: true,
      headers: { Accept: "image/*,*/*" },
    });
    // When rawResponse is true, data is Response — extract blob
    const response = envelope.data as unknown as Response;
    if (response instanceof Response) return response.blob();
    // Fallback if envelope wrapping changed
    return envelope.data as unknown as Blob;
  },

  getStorageSignedUrl(params: { key: string; expires: string | number; signature: string }): Promise<Blob> {
    return apiClient.get<Blob>("/storage/signed", { params: params as unknown as Record<string, unknown> });
  },

  getStorageFile(params: { key: string }): Promise<Blob> {
    return apiClient.get<Blob>("/storage/file", { params: params as unknown as Record<string, unknown> });
  },
};
