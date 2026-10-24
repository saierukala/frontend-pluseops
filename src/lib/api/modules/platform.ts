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

// ── Platform operations (backend Phase 33) ─────────────────────────────

export type MoneyByCurrency = Array<{ currency: string; amount: string }>;

export interface PlatformOverview {
  tenants: { total: number; byStatus: Record<string, number>; byPlan: Record<string, number>; newByMonth: Array<{ month: string; count: number }> };
  users: { active: number };
  orders: { total: number; last30Days: number };
  revenue: { total: MoneyByCurrency; last30Days: MoneyByCurrency };
}

export type PlanLimitKey = "users" | "products" | "warehouses" | "ordersPerMonth";
/** null = unlimited */
export type PlanLimits = Partial<Record<PlanLimitKey, number | null>>;

export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  limits: PlanLimits;
  isActive: boolean;
  tenantCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantUsage {
  tenantId: string;
  plan: Plan | null;
  usage: Record<PlanLimitKey, number>;
  lastActivityAt: string | null;
}

export interface PlatformRole {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  adminCount: number;
}

export interface PlatformAdmin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  roles: Array<{ id: string; name: string }>;
}

export interface PlatformAuditEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  tenant: { id: string; name: string; slug: string } | null;
  actor: { id: string; email: string } | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface PlatformAuditParams {
  page?: number;
  limit?: number;
  action?: string;
  tenantId?: string;
  actorUserId?: string;
  from?: string;
  to?: string;
}

export interface SupportSession {
  sessionId: string;
  accessToken: string;
  expiresAt: string;
  readOnly: boolean;
  tenant: { id: string; name: string; slug: string };
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

  getOverview(): Promise<PlatformOverview> {
    return apiClient.get<PlatformOverview>("/platform/overview");
  },

  getTenantUsage(id: string): Promise<TenantUsage> {
    return apiClient.get<TenantUsage>(`/platform/tenants/${id}/usage`);
  },

  /** 400 when the plan code is unknown or inactive. */
  assignPlan(id: string, plan: string): Promise<Tenant> {
    return apiClient.patch<Tenant>(`/platform/tenants/${id}/plan`, { plan });
  },

  listPlans(params?: { includeInactive?: boolean }): Promise<Plan[]> {
    return apiClient.get<Plan[]>("/platform/plans", { params: params?.includeInactive ? { includeInactive: "true" } : undefined });
  },

  createPlan(body: { code: string; name: string; description?: string | null; limits?: PlanLimits; isActive?: boolean }): Promise<Plan> {
    return apiClient.post<Plan>("/platform/plans", body);
  },

  updatePlan(code: string, body: { name?: string; description?: string | null; limits?: PlanLimits; isActive?: boolean }): Promise<Plan> {
    return apiClient.patch<Plan>(`/platform/plans/${encodeURIComponent(code)}`, body);
  },

  listRoles(): Promise<PlatformRole[]> {
    return apiClient.get<PlatformRole[]>("/platform/roles");
  },

  listAdmins(): Promise<PlatformAdmin[]> {
    return apiClient.get<PlatformAdmin[]>("/platform/admins");
  },

  addAdmin(body: { email: string; password: string; firstName: string; lastName: string; roleId?: string }): Promise<PlatformAdmin> {
    return apiClient.post<PlatformAdmin>("/platform/admins", body);
  },

  /** 409 when removing yourself. */
  removeAdmin(userId: string): Promise<void> {
    return apiClient.del<void>(`/platform/admins/${userId}`);
  },

  listAuditLogsEnvelope(params?: PlatformAuditParams) {
    return apiClient.requestEnvelope<PlatformAuditEntry[]>("/platform/audit-logs", { params: params as Record<string, unknown> });
  },

  /** Read-only, 30-minute token scoped to one tenant. Use it per request; never store it as the signed-in session. */
  startSupportSession(tenantId: string, reason: string): Promise<SupportSession> {
    return apiClient.post<SupportSession>(`/platform/tenants/${tenantId}/support-sessions`, { reason });
  },

  endSupportSession(sessionId: string): Promise<unknown> {
    return apiClient.del(`/platform/support-sessions/${sessionId}`);
  },
};
