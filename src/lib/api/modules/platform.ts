/**
 * Platform API — F05 platform/tenant contract (real backend)
 * Endpoints mounted at /api/v1/platform/*
 * All require platform scope JWT (scope=platform) + authorizePlatform.
 * See docs/IMPLEMENTATION_REPORT_PLATFORM_AUTH.md §4
 */

import { apiClient } from "../client";
import type { Tenant, User } from "../types";

export interface PlatformListTenantsParams {
  page?: number;
  limit?: number;
  status?: Tenant["status"];
  search?: string;
}

export interface CreateTenantWithAdminBody {
  name: string;
  slug: string;
  status?: Tenant["status"];
  plan?: string;
  admin: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateTenantOnlyBody {
  name: string;
  slug: string;
  status?: Tenant["status"];
  plan?: string;
}

export interface UpdateTenantBody {
  name?: string;
  slug?: string;
  status?: Tenant["status"];
  plan?: string;
}

export interface CreateTenantAdminBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface PlatformTenantResponse {
  tenant: Tenant & { settings?: unknown; domains?: unknown[] };
  adminUser?: User;
}

export const platformApi = {
  listTenants(params?: PlatformListTenantsParams): Promise<Tenant[]> {
    return apiClient.get<Tenant[]>("/platform/tenants", { params: params as Record<string, unknown> });
  },

  listTenantsEnvelope(params?: PlatformListTenantsParams) {
    return apiClient.requestEnvelope<Tenant[]>("/platform/tenants", {
      params: params as unknown as Record<string, unknown>,
    });
  },

  createTenant(body: CreateTenantWithAdminBody | CreateTenantOnlyBody): Promise<{ tenant: Tenant; adminUser?: User }> {
    return apiClient.post<{ tenant: Tenant; adminUser?: User }>("/platform/tenants", body);
  },

  getTenant(id: string): Promise<Tenant> {
    return apiClient.get<Tenant>(`/platform/tenants/${id}`);
  },

  updateTenant(id: string, body: UpdateTenantBody): Promise<Tenant> {
    return apiClient.patch<Tenant>(`/platform/tenants/${id}`, body);
  },

  updateTenantStatus(id: string, status: Tenant["status"]): Promise<Tenant> {
    return apiClient.patch<Tenant>(`/platform/tenants/${id}/status`, { status });
  },

  createTenantAdmin(id: string, body: CreateTenantAdminBody): Promise<User> {
    return apiClient.post<User>(`/platform/tenants/${id}/admin`, body);
  },
};
