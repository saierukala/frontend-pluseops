/**
 * Jobs — F04 (authenticated, no specific perm per handoff §3)
 * GET /jobs/status, POST /jobs/notifications, POST /jobs/cleanup, POST /jobs/reports, POST /jobs/analytics
 */

import { apiClient } from "../client";

export interface JobsStatus {
  enabled: boolean;
  workersStarted: boolean;
  queues: string[];
}

export const jobsApi = {
  getStatus(): Promise<JobsStatus> {
    return apiClient.get<JobsStatus>("/jobs/status");
  },
  enqueueNotification(body: {
    title: string;
    message: string;
    channel?: string;
    userId?: string;
    referenceType?: string;
    referenceId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ jobId: string; queued: boolean }> {
    return apiClient.post<{ jobId: string; queued: boolean }>("/jobs/notifications", body);
  },
  cleanup(): Promise<{ jobId: string; queued: boolean }> {
    return apiClient.post<{ jobId: string; queued: boolean }>("/jobs/cleanup", {});
  },
  reports(body?: Record<string, unknown>): Promise<{ jobId: string; queued: boolean }> {
    return apiClient.post<{ jobId: string; queued: boolean }>("/jobs/reports", body ?? {});
  },
  analytics(body?: Record<string, unknown>): Promise<{ jobId: string; queued: boolean }> {
    return apiClient.post<{ jobId: string; queued: boolean }>("/jobs/analytics", body ?? {});
  },
};
