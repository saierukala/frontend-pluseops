/**
 * API configuration — F04
 * Single source for base URL / timeouts. Values come from src/config/env.ts
 * which validates NEXT_PUBLIC_API_BASE_URL (public) — never expose secrets.
 */
import { publicEnv } from "@/config/env";

export const apiConfig = {
  baseUrl: publicEnv.apiBaseUrl,
  // No trailing slash — getApiUrl already strips it.
  timeoutMs: 15_000,
  // Header names used by backend
  headers: {
    requestId: "X-Request-Id",
    retryAfter: "Retry-After",
    rateLimitReset: "RateLimit-Reset",
  } as const,
} as const;

export type ApiConfig = typeof apiConfig;

/**
 * Signed file URLs from the API are relative (`/api/v1/storage/signed?…`) with local storage and absolute with S3.
 * Relative ones belong to the API's origin, not the web app's.
 */
export function apiAssetUrl(url: string): string {
  return url.startsWith("/") ? `${publicEnv.apiUrl}${url}` : url;
}
