/**
 * Attributes — F04
 * Handoff §3: POST /attributes, GET /attributes, PATCH /attributes/:id, DELETE /attributes/:id
 *           + POST/GET /attributes/:attributeId/values, PATCH/DELETE .../values/:valueId
 */

import { apiClient } from "../client";
import type { QueryParams } from "../query";

export interface AttributeDefinition {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  dataType: "TEXT" | "NUMBER" | "BOOLEAN" | "OPTION";
  isRequired: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttributeValue {
  id: string;
  tenantId: string;
  attributeDefinitionId: string;
  value: string;
  displayName: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const attributesApi = {
  create(body: { name: string; code: string; dataType: AttributeDefinition["dataType"]; isRequired?: boolean; description?: string }): Promise<AttributeDefinition> {
    return apiClient.post<AttributeDefinition>("/attributes", body);
  },
  list(params?: QueryParams): Promise<AttributeDefinition[]> {
    return apiClient.get<AttributeDefinition[]>("/attributes", { params: params as Record<string, unknown> });
  },
  listEnvelope(params?: QueryParams) {
    return apiClient.requestEnvelope<AttributeDefinition[]>("/attributes", { params: params as Record<string, unknown> });
  },
  getById(id: string): Promise<AttributeDefinition> {
    return apiClient.get<AttributeDefinition>(`/attributes/${id}`);
  },
  update(id: string, body: Partial<{ name: string; code: string; dataType: AttributeDefinition["dataType"]; isRequired: boolean; description?: string }>): Promise<AttributeDefinition> {
    return apiClient.patch<AttributeDefinition>(`/attributes/${id}`, body);
  },
  remove(id: string): Promise<AttributeDefinition> {
    return apiClient.del<AttributeDefinition>(`/attributes/${id}`);
  },

  // Values
  createValue(
    attributeId: string,
    body: { value: string; displayName: string; sortOrder?: number; isActive?: boolean }
  ): Promise<AttributeValue> {
    return apiClient.post<AttributeValue>(`/attributes/${attributeId}/values`, body);
  },
  listValues(attributeId: string): Promise<AttributeValue[]> {
    return apiClient.get<AttributeValue[]>(`/attributes/${attributeId}/values`);
  },
  updateValue(
    attributeId: string,
    valueId: string,
    body: Partial<{ value: string; displayName: string; sortOrder: number; isActive: boolean }>
  ): Promise<AttributeValue> {
    return apiClient.patch<AttributeValue>(`/attributes/${attributeId}/values/${valueId}`, body);
  },
  removeValue(attributeId: string, valueId: string): Promise<AttributeValue> {
    return apiClient.del<AttributeValue>(`/attributes/${attributeId}/values/${valueId}`);
  },
};
