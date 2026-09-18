/**
 * Dashboard — F04
 * Handoff §3: GET /dashboard/overview (x-cache header, TTL 60s)
 */

import { apiClient } from "../client";

export interface DashboardOverview {
  // Shape is aggregate; keep generic so we do not invent fields.
  [key: string]: unknown;
}

export const dashboardApi = {
  getOverview(): Promise<DashboardOverview> {
    return apiClient.get<DashboardOverview>("/dashboard/overview");
  },
  getOverviewEnvelope() {
    return apiClient.requestEnvelope<DashboardOverview>("/dashboard/overview");
  },
};
