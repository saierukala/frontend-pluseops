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
  /** GST % charged on new orders; null means the platform default (18). */
  gstRatePercent: number | null;
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

export interface PaymentGateway {
  provider: "razorpay";
  configured: boolean;
  enabled: boolean;
  keyId: string | null;
  mode: "test" | "live" | null;
  webhookSecretSet: boolean;
  /** Path to append to the API origin; enter the full URL in the Razorpay dashboard. */
  webhookUrlPath: string;
  updatedAt: string | null;
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

  // Phase 35: the shop's own Razorpay account. Secrets are write-only.
  getPaymentGateway(): Promise<PaymentGateway> {
    return apiClient.get<PaymentGateway>("/workspace/payment-gateway");
  },
  /** Razorpay checks the keys first: 422 RAZORPAY_KEYS_INVALID, 502 when Razorpay can't be reached. */
  savePaymentGateway(body: { keyId: string; keySecret: string; webhookSecret?: string; enabled?: boolean }): Promise<PaymentGateway> {
    return apiClient.put<PaymentGateway>("/workspace/payment-gateway", body);
  },
  setPaymentGatewayEnabled(enabled: boolean): Promise<PaymentGateway> {
    return apiClient.patch<PaymentGateway>("/workspace/payment-gateway", { enabled });
  },
  removePaymentGateway(): Promise<unknown> {
    return apiClient.del<unknown>("/workspace/payment-gateway");
  },
};
