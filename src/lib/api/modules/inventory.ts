/**
 * Inventory — F04
 * Handoff §3: GET /inventory, GET /inventory/variants/:variantId, POST /inventory/adjust, POST /inventory/transfer,
 *             GET /inventory/movements, GET /inventory/low-stock
 */

import { apiClient } from "../client";
import type { QueryParams } from "../query";

export interface InventoryRow {
  id: string;
  tenantId: string;
  productVariantId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  tenantId: string;
  productVariantId: string;
  warehouseId: string;
  type: string;
  quantityBefore: number;
  quantityChanged: number;
  quantityAfter: number;
  reason?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
}

export const inventoryApi = {
  list(params?: QueryParams): Promise<InventoryRow[]> {
    return apiClient.get<InventoryRow[]>("/inventory", { params: params as Record<string, unknown> });
  },
  listEnvelope(params?: QueryParams) {
    return apiClient.requestEnvelope<InventoryRow[]>("/inventory", { params: params as Record<string, unknown> });
  },
  getByVariant(variantId: string, params?: QueryParams): Promise<InventoryRow[]> {
    return apiClient.get<InventoryRow[]>(`/inventory/variants/${variantId}`, {
      params: params as Record<string, unknown>,
    });
  },
  adjust(body: {
    variantId?: string;
    productVariantId?: string;
    warehouseId: string;
    quantityChanged: number;
    reason?: string;
    referenceType?: string;
    referenceId?: string;
  }): Promise<{ inventory: InventoryRow; movement: InventoryMovement }> {
    // Backend accepts variantId or productVariantId — normalize to variantId
    const payload: Record<string, unknown> = { ...body };
    if (payload.productVariantId && !payload.variantId) {
      payload.variantId = payload.productVariantId;
      delete payload.productVariantId;
    }
    return apiClient.post<{ inventory: InventoryRow; movement: InventoryMovement }>("/inventory/adjust", payload);
  },
  transfer(body: {
    variantId: string;
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    quantity: number;
    reason?: string;
    referenceType?: string;
    referenceId?: string;
  }): Promise<{
    sourceInventory: InventoryRow;
    destInventory: InventoryRow;
    movements: InventoryMovement[];
  }> {
    return apiClient.post<{
      sourceInventory: InventoryRow;
      destInventory: InventoryRow;
      movements: InventoryMovement[];
    }>("/inventory/transfer", body);
  },
  listMovements(params?: QueryParams): Promise<InventoryMovement[]> {
    return apiClient.get<InventoryMovement[]>("/inventory/movements", {
      params: params as Record<string, unknown>,
    });
  },
  listMovementsEnvelope(params?: QueryParams) {
    return apiClient.requestEnvelope<InventoryMovement[]>("/inventory/movements", {
      params: params as Record<string, unknown>,
    });
  },
  lowStock(params?: QueryParams): Promise<InventoryRow[]> {
    return apiClient.get<InventoryRow[]>("/inventory/low-stock", { params: params as Record<string, unknown> });
  },
  lowStockEnvelope(params?: QueryParams) {
    return apiClient.requestEnvelope<InventoryRow[]>("/inventory/low-stock", {
      params: params as Record<string, unknown>,
    });
  },
};
