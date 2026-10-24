/**
 * Reports — CSV exports built by the worker (backend Phase 31) and recurring schedules (Phase 36)
 * POST/GET /reports, GET /reports/:id, GET /reports/:id/download (5-minute signed URL)
 * GET/POST /report-schedules, GET/PATCH/DELETE /report-schedules/:id
 */

import { apiClient } from "../client";

export type ReportType = "ORDERS" | "INVENTORY" | "CUSTOMERS";
export type ReportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type ReportFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export interface ReportFilters {
  from?: string;
  to?: string;
  status?: string;
  warehouseId?: string;
}

export interface Report {
  id: string;
  type: ReportType;
  format: string;
  status: ReportStatus;
  filters: ReportFilters;
  rowCount: number | null;
  sizeBytes: number | null;
  error: string | null;
  requestedBy: string | null;
  scheduleId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  /** When retention deletes it; null = kept */
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDownload {
  url: string;
  fileName: string;
  expiresAt: string;
}

export interface ReportSchedule {
  id: string;
  name: string;
  type: ReportType;
  frequency: ReportFrequency;
  filters: Pick<ReportFilters, "status" | "warehouseId">;
  recipientUserIds: string[];
  enabled: boolean;
  createdBy: string | null;
  lastPeriod: string | null;
  lastRunAt: string | null;
  lastReportId: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportScheduleBody {
  name: string;
  type: ReportType;
  frequency: ReportFrequency;
  filters?: Pick<ReportFilters, "status" | "warehouseId">;
  recipientUserIds?: string[];
  enabled?: boolean;
}

/** Filters each report type accepts (dates are UTC days, inclusive). */
export const REPORT_FILTERS: Record<ReportType, Array<keyof ReportFilters>> = {
  ORDERS: ["from", "to", "status"],
  INVENTORY: ["warehouseId"],
  CUSTOMERS: ["from", "to"],
};

/** Read permission the data behind each report type needs, on top of report:create. */
export const REPORT_DATA_PERMISSION: Record<ReportType, string> = {
  ORDERS: "order:read",
  INVENTORY: "inventory:read",
  CUSTOMERS: "customer:read",
};

export const reportsApi = {
  listEnvelope(params?: { page?: number; limit?: number; type?: ReportType; status?: ReportStatus }) {
    return apiClient.requestEnvelope<Report[]>("/reports", { params: params as Record<string, unknown> });
  },
  get(id: string): Promise<Report> {
    return apiClient.get<Report>(`/reports/${id}`);
  },
  /** 202: the worker builds the file; poll get() until COMPLETED or FAILED. */
  request(body: { type: ReportType; filters?: ReportFilters }): Promise<Report> {
    return apiClient.post<Report>("/reports", body);
  },
  /** 409 REPORT_NOT_READY until COMPLETED. The URL is relative to the API origin and valid for 5 minutes. */
  download(id: string): Promise<ReportDownload> {
    return apiClient.get<ReportDownload>(`/reports/${id}/download`);
  },

  listSchedulesEnvelope(params?: { page?: number; limit?: number }) {
    return apiClient.requestEnvelope<ReportSchedule[]>("/report-schedules", { params: params as Record<string, unknown> });
  },
  createSchedule(body: ReportScheduleBody): Promise<ReportSchedule> {
    return apiClient.post<ReportSchedule>("/report-schedules", body);
  },
  updateSchedule(id: string, body: Partial<Omit<ReportScheduleBody, "type">>): Promise<ReportSchedule> {
    return apiClient.patch<ReportSchedule>(`/report-schedules/${id}`, body);
  },
  deleteSchedule(id: string): Promise<void> {
    return apiClient.del<void>(`/report-schedules/${id}`);
  },
};
