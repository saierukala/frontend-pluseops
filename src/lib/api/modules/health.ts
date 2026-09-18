/**
 * Health / readiness / metrics — F04 (public)
 * Handoff §3 + §18: GET /health, /health/db, /health/redis, /ready, /metrics
 * and versioned aliases /api/v1/health*. Note: baseUrl already includes /api/v1,
 * so liveness probes use root-style paths via absolute URLs — here we expose
 * both families through the central client without hardcoding origins.
 */

import { apiClient } from "../client";

export interface HealthData {
  status: string;
  name?: string;
  data?: Record<string, unknown>;
}

export const healthApi = {
  getHealth(): Promise<HealthData> {
    return apiClient.get<HealthData>("/health");
  },
  getHealthDb(): Promise<HealthData> {
    return apiClient.get<HealthData>("/health/db");
  },
  getHealthRedis(): Promise<HealthData> {
    return apiClient.get<HealthData>("/health/redis");
  },
  getReady(): Promise<HealthData> {
    return apiClient.get<HealthData>("/ready");
  },
  getMetrics(): Promise<string> {
    // /metrics is text (Prometheus) — fetch raw. Use client rawResponse.
    return apiClient
      .request<string>("/metrics", { method: "GET", rawResponse: false } as unknown as never)
      .catch(async () => {
        // Fallback: raw fetch is needed for non-JSON; do direct request
        const envelope = await apiClient.requestEnvelope<string>("/metrics", {
          method: "GET",
          headers: { Accept: "text/plain" },
        });
        return envelope.data;
      });
  },
};
