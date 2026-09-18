/**
 * Audit & Activity Logs — F04
 * Handoff §3: GET /audit-logs, GET /activity-logs, GET /activity-logs/:id
 */

import { apiClient } from "../client";
import type { QueryParams } from "../query";

export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  tenantId: string;
  userId?: string | null;
  action: string;
  description?: string | null;
  createdAt: string;
}

export const auditApi = {
  listAuditLogs(params?: QueryParams): Promise<AuditLog[]> {
    return apiClient.get<AuditLog[]>("/audit-logs", { params: params as Record<string, unknown> });
  },
  listAuditLogsEnvelope(params?: QueryParams) {
    return apiClient.requestEnvelope<AuditLog[]>("/audit-logs", { params: params as Record<string, unknown> });
  },
  listActivityLogs(params?: QueryParams): Promise<ActivityLog[]> {
    return apiClient.get<ActivityLog[]>("/activity-logs", { params: params as Record<string, unknown> });
  },
  listActivityLogsEnvelope(params?: QueryParams) {
    return apiClient.requestEnvelope<ActivityLog[]>("/activity-logs", {
      params: params as Record<string, unknown>,
    });
  },
  getActivityById(id: string): Promise<ActivityLog> {
    return apiClient.get<ActivityLog>(`/activity-logs/${id}`);
  },
};
