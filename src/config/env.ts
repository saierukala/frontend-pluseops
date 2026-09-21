/**
 * Environment configuration — F01 Project Foundation
 * Validates and exposes typed environment variables.
 * Client-safe: only NEXT_PUBLIC_* are exposed to the browser.
 * Server variables (without NEXT_PUBLIC_) are validated server-side only.
 */

// Reserved for future server-only secrets (e.g. SENTRY_DSN). Keep helper for F02+.
function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Ensure helper is considered used for lint (F01 reserves it for server validation)
void getEnvVar;

function getOptionalEnvVar(key: string, fallback: string): string {
  const value = process.env[key];
  if (value === undefined || value === "") return fallback;
  return value;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function assertUrl(key: string, value: string): string {
  if (!isValidUrl(value)) {
    throw new Error(`Invalid URL for ${key}: "${value}"`);
  }
  // Strip trailing slash for consistency
  return value.replace(/\/+$/, "");
}

// ---------------------------------------------------------------------------
// Public (client-exposed) env — validated on both server and client
// ---------------------------------------------------------------------------

export const publicEnv = {
  appName: getOptionalEnvVar("NEXT_PUBLIC_APP_NAME", "PulseOps"),
  appUrl: assertUrl(
    "NEXT_PUBLIC_APP_URL",
    getOptionalEnvVar("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
  ),
  appDescription: getOptionalEnvVar(
    "NEXT_PUBLIC_APP_DESCRIPTION",
    "PulseOps — Business operations platform"
  ),
  apiUrl: assertUrl(
    "NEXT_PUBLIC_API_URL",
    getOptionalEnvVar("NEXT_PUBLIC_API_URL", "http://localhost:3000")
  ),
  apiBaseUrl: assertUrl(
    "NEXT_PUBLIC_API_BASE_URL",
    getOptionalEnvVar("NEXT_PUBLIC_API_BASE_URL", "http://localhost:3000/api/v1")
  ),
  socketUrl: assertUrl(
    "NEXT_PUBLIC_SOCKET_URL",
    getOptionalEnvVar("NEXT_PUBLIC_SOCKET_URL", "http://localhost:3000")
  ),
  // DEPRECATED: NEXT_PUBLIC_TENANT_ID / NEXT_PUBLIC_DEFAULT_TENANT_ID are no longer used for authorization.
  // Backend is authoritative for tenant identity via JWT scope. Tenant login uses tenantSlug (Workspace).
  // Kept only for backward-compat reading if needed externally — do NOT use for auth logic.
} as const;

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------

export const env = {
  ...publicEnv,
  nodeEnv: getOptionalEnvVar("NODE_ENV", "development") as "development" | "production" | "test",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  isBrowser: typeof window !== "undefined",
} as const;

export type Env = typeof env;

// ---------------------------------------------------------------------------
// Server-only validation (call in server context if you add secrets later)
// ---------------------------------------------------------------------------

export function validateServerEnv(): void {
  // Currently no required server-only secrets for F01.
  // When secrets are added (e.g. SENTRY_DSN), validate them here:
  // getEnvVar("SECRET_KEY");
}

export function getApiUrl(path: string = ""): string {
  const base = publicEnv.apiBaseUrl;
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getSocketUrl(): string {
  return publicEnv.socketUrl;
}
