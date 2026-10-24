/**
 * Tenants — F04 (public, no auth per handoff §3 Tenants)
 * POST /tenants, GET /tenants/:id, PATCH /tenants/:id, DELETE /tenants/:id
 * NOTE: GET /tenants list is BACKEND DEPENDENCY — not exposed.
 */

import { apiClient } from "../client";
import type { Tenant } from "../types";

export const tenantsApi = {
  create(body: { name: string; slug: string; status?: Tenant["status"]; plan?: string }): Promise<Tenant> {
    return apiClient.post<Tenant>("/tenants", body, { skipAuthRefresh: true });
  },
  getById(id: string): Promise<Tenant> {
    return apiClient.get<Tenant>(`/tenants/${id}`, { skipAuthRefresh: true });
  },
  update(id: string, body: Partial<{ name: string; slug: string; status: Tenant["status"]; plan: string }>): Promise<Tenant> {
    return apiClient.patch<Tenant>(`/tenants/${id}`, body, { skipAuthRefresh: true });
  },
  remove(id: string): Promise<null> {
    return apiClient.del<null>(`/tenants/${id}`, { skipAuthRefresh: true });
  },
};

export interface WorkspaceSettings {
  currency: string | null;
  timezone: string | null;
  locale: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

export interface WorkspaceDomain {
  id: string;
  domain: string;
  primary: boolean;
  verified: boolean;
  verifiedAt: string | null;
  /** DNS TXT record to publish to prove ownership; null once verified. */
  verification: { type: "TXT"; name: string; value: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace extends Tenant {
  settings: WorkspaceSettings;
  domains: WorkspaceDomain[];
}

/** The signed-in user's own tenant: profile, settings and custom domains. Slug/status/plan are platform-controlled. */
export const workspaceApi = {
  get(): Promise<Workspace> {
    return apiClient.get<Workspace>("/workspace");
  },
  rename(name: string): Promise<Workspace> {
    return apiClient.patch<Workspace>("/workspace", { name });
  },
  getSettings(): Promise<WorkspaceSettings> {
    return apiClient.get<WorkspaceSettings>("/workspace/settings");
  },
  /** Only the keys sent change; null clears a setting. */
  updateSettings(body: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
    return apiClient.patch<WorkspaceSettings>("/workspace/settings", body);
  },
  listDomains(): Promise<WorkspaceDomain[]> {
    return apiClient.get<WorkspaceDomain[]>("/workspace/domains");
  },
  addDomain(domain: string): Promise<WorkspaceDomain> {
    return apiClient.post<WorkspaceDomain>("/workspace/domains", { domain });
  },
  makePrimary(domainId: string): Promise<WorkspaceDomain> {
    return apiClient.patch<WorkspaceDomain>(`/workspace/domains/${domainId}`, { primary: true });
  },
  verifyDomain(domainId: string): Promise<WorkspaceDomain> {
    return apiClient.post<WorkspaceDomain>(`/workspace/domains/${domainId}/verify`, {});
  },
  removeDomain(domainId: string): Promise<unknown> {
    return apiClient.del<unknown>(`/workspace/domains/${domainId}`);
  },
};
