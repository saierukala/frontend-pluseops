/**
 * Central API client — F04 + F06 Session & Security
 * Flow: Component -> Feature API -> Central API Client -> Backend
 *
 * Responsibilities:
 * - Base URL from env (NEXT_PUBLIC_API_BASE_URL)
 * - Authorization header (Bearer access token)
 * - Request/correlation ID (X-Request-Id generate + echo)
 * - JSON parsing + envelope handling
 * - Centralized error normalization
 * - 401 -> single-flight refresh -> retry once (F06)
 * - 403 forced logout for tenant/platform scope failures
 * - 429 handling (Retry-After surfaced, no auto-retry)
 * - Timeout + abort
 * - Pagination/query wired via helpers but not assumed
 * - Token lifecycle: access 15m, refresh 7d rotation, scope preserved
 * - No tokens in URLs/logs/UI
 */

import { apiConfig } from "./config";
import { tokenStore as defaultTokenStore, type TokenStore } from "./tokens";
import {
  ApiError,
  NetworkError,
  ParseError,
  parseRetryAfterMs,
  toApiError,
} from "./errors";
import type { SuccessEnvelope } from "./types";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions extends Omit<RequestInit, "method" | "body" | "headers"> {
  params?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  /**
   * Set true to skip automatic 401 refresh handling (e.g. for the refresh call itself).
   */
  skipAuthRefresh?: boolean;
  /**
   * Internal: marks that this is already a retried request after refresh.
   */
  _retried?: boolean;
  /**
   * Raw response handling for binary endpoints (file / signed-url streams).
   * When true, return Response directly (caller handles blob/stream).
   */
  rawResponse?: boolean;
  /**
   * Timeout in ms (overrides default).
   */
  timeoutMs?: number;
}

export interface ApiClientOptions {
  baseUrl?: string;
  tokenStore?: TokenStore;
  /**
   * Called when refresh fails or no refresh token exists (e.g. redirect to login).
   * F04 does not implement navigation; caller (F05/F06) may provide this.
   */
  onAuthFailure?: (error: ApiError) => void;
  fetchImpl?: typeof fetch;
}

function generateRequestId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return (crypto as unknown as { randomUUID: () => string }).randomUUID();
    }
  } catch {
    // fallback
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

function buildUrlWithParams(path: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) return path;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      for (const item of v) {
        if (item === undefined || item === null || item === "") continue;
        sp.append(k, String(item));
      }
      continue;
    }
    if (v instanceof Date) {
      sp.append(k, v.toISOString());
      continue;
    }
    sp.append(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${path}${path.includes("?") ? "&" : "?"}${qs}` : path;
}

/**
 * Codes that MUST force logout per F06 spec E.
 * These are backend error codes that indicate session cannot be recovered.
 */
export const FORCED_LOGOUT_CODES = new Set([
  "INVALID_REFRESH_TOKEN",
  "REFRESH_TOKEN_EXPIRED",
  "REFRESH_TOKEN_REVOKED",
  "USER_NOT_FOUND",
  "TENANT_INACTIVE",
  "PLATFORM_ACCESS_DENIED",
]);

/**
 * 401 codes that are eligible for refresh retry (access token failures).
 * Only these should trigger single-flight refresh.
 */
const REFRESH_ELIGIBLE_CODES = new Set([
  "TOKEN_EXPIRED",
  "INVALID_TOKEN",
  "INVALID_TOKEN_CLAIMS",
  "UNAUTHORIZED",
  // Fallback: empty code from generic 401
]);

export class ApiClient {
  readonly baseUrl: string;
  readonly tokenStore: TokenStore;
  onAuthFailure?: (error: ApiError) => void;
  private readonly fetchImpl: typeof fetch;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(opts: ApiClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? apiConfig.baseUrl).replace(/\/+$/, "");
    this.tokenStore = opts.tokenStore ?? defaultTokenStore;
    this.onAuthFailure = opts.onAuthFailure;
    this.fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
  }

  setAuthFailureHandler(handler: (error: ApiError) => void): void {
    this.onAuthFailure = handler;
  }

  // -------------------------------------------------------------------------
  // Public verb helpers
  // -------------------------------------------------------------------------

  get<T>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...opts, method: "GET" } as RequestOptions & { method: HttpMethod });
  }

  post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...opts, body, method: "POST" } as RequestOptions & { method: HttpMethod });
  }

  put<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...opts, body, method: "PUT" } as RequestOptions & { method: HttpMethod });
  }

  patch<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...opts, body, method: "PATCH" } as RequestOptions & { method: HttpMethod });
  }

  del<T>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...opts, method: "DELETE" } as RequestOptions & { method: HttpMethod });
  }

  /**
   * Multipart upload — caller provides FormData (field `image` etc.)
   */
  upload<T>(path: string, formData: FormData, opts?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...opts,
      body: formData,
      method: "POST",
      headers: { ...(opts?.headers ?? {}) },
    } as RequestOptions & { method: HttpMethod });
  }

  /**
   * Core request — handles headers, JSON, envelope, errors, refresh+retry.
   * Returns the `data` field of SuccessEnvelope<T> for ergonomic use.
   * For paginated endpoints, callers can use requestEnvelope to access meta.
   */
  async request<T>(path: string, options: RequestOptions & { method?: HttpMethod }): Promise<T> {
    const envelope = await this.requestEnvelope<T>(path, options);
    return envelope.data;
  }

  /**
   * Full envelope access (includes meta + requestId). Use for paginated lists.
   */
  async requestEnvelope<T>(
    path: string,
    options: RequestOptions & { method?: HttpMethod } = {}
  ): Promise<SuccessEnvelope<T>> {
    const {
      params,
      body,
      headers: customHeaders = {},
      skipAuthRefresh = false,
      _retried = false,
      rawResponse = false,
      timeoutMs = apiConfig.timeoutMs,
      method = "GET",
      signal: externalSignal,
      ...rest
    } = options as RequestOptions & { method?: HttpMethod; signal?: AbortSignal };

    const urlPath = buildUrlWithParams(path.startsWith("/") ? path : `/${path}`, params as Record<string, unknown> | undefined);
    const url = `${this.baseUrl}${urlPath}`;

    const requestId = customHeaders[apiConfig.headers.requestId] ?? customHeaders["X-Request-Id"] ?? generateRequestId();

    const headers: Record<string, string> = {
      Accept: "application/json",
      [apiConfig.headers.requestId]: requestId,
      ...customHeaders,
    };

    // Authorization — central Bearer injection, never in URL
    const accessToken = this.tokenStore.getAccessToken();
    if (accessToken && !headers["Authorization"] && !headers["authorization"]) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    // Body handling
    let fetchBody: BodyInit | undefined;
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    if (body !== undefined && body !== null) {
      if (isFormData) {
        fetchBody = body as unknown as BodyInit;
        delete headers["Content-Type"];
        delete headers["content-type"];
      } else if (typeof body === "string") {
        fetchBody = body;
        if (!headers["Content-Type"] && !headers["content-type"]) headers["Content-Type"] = "application/json";
      } else {
        fetchBody = JSON.stringify(body);
        if (!headers["Content-Type"] && !headers["content-type"]) headers["Content-Type"] = "application/json";
      }
    }

    // Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new DOMException("Timeout", "AbortError")), timeoutMs);
    const signal = externalSignal
      ? (() => {
          if (externalSignal.aborted) controller.abort(externalSignal.reason);
          else externalSignal.addEventListener("abort", () => controller.abort(externalSignal.reason), { once: true });
          return controller.signal;
        })()
      : controller.signal;

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method,
        headers,
        body: fetchBody,
        signal,
        ...rest,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === "AbortError") {
        const isTimeout = (err as DOMException).message === "Timeout";
        throw new NetworkError(isTimeout ? "Request timed out. Please try again." : "Request was aborted.", { cause: err });
      }
      throw new NetworkError(undefined, { cause: err });
    } finally {
      clearTimeout(timeoutId);
    }

    const responseHeaders = headersToRecord(response.headers);
    const responseRequestId =
      response.headers.get(apiConfig.headers.requestId) ??
      response.headers.get("x-request-id") ??
      requestId;

    // Binary passthrough
    if (rawResponse) {
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        let parsed: unknown = null;
        try {
          parsed = text ? (JSON.parse(text) as unknown) : null;
        } catch {
          parsed = null;
        }
        const p = parsed as { error?: { code?: string; message?: string }; requestId?: string } | null;
        const retryAfterMs = response.status === 429 ? parseRetryAfterMs(responseHeaders) : null;
        const apiError = toApiError({
          status: response.status,
          backendCode: p?.error?.code ?? null,
          message: p?.error?.message ?? text ?? response.statusText,
          details: (p?.error as unknown) ?? parsed,
          requestId: p?.requestId ?? responseRequestId,
          headers: responseHeaders,
          retryAfterMs,
        });
        // Forced logout for 401/403 with specific codes even on raw path
        this.handleForcedLogoutIfNeeded(apiError, skipAuthRefresh);
        throw apiError;
      }
      return {
        success: true,
        data: response as unknown as T,
        requestId: responseRequestId,
      };
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true, data: null as unknown as T, requestId: responseRequestId };
    }

    // Parse body (JSON expected, but be defensive)
    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    let rawText: string | null = null;
    let json: unknown = null;
    let parseFailed = false;

    try {
      if (isJson) {
        json = await response.json();
      } else {
        rawText = await response.text();
        if (rawText) {
          try {
            json = JSON.parse(rawText) as unknown;
          } catch {
            json = rawText;
            if (!response.ok) parseFailed = true;
          }
        } else {
          json = null;
        }
      }
    } catch (err) {
      throw new ParseError("Malformed response from server.", responseRequestId, responseHeaders, err);
    }

    // Error path
    if (!response.ok) {
      const envelope = json as { success?: boolean; error?: { code?: string; message?: string; details?: unknown }; requestId?: string } | null;
      const backendCode = (envelope?.error?.code ?? null) as string | null;
      const normalizedCode = backendCode ? backendCode.toUpperCase() : null;

      // Forced logout codes must NOT attempt refresh — clear immediately
      // 403 TENANT_INACTIVE / PLATFORM_ACCESS_DENIED, 401 USER_NOT_FOUND / refresh failures
      if (normalizedCode && FORCED_LOGOUT_CODES.has(normalizedCode)) {
        // Refresh failure codes already indicate unrecoverable session
        // But if this is the refresh endpoint itself, we still clear
        const apiError = toApiError({
          status: response.status,
          backendCode,
          message: envelope?.error?.message ?? response.statusText,
          details: (envelope?.error as unknown) ?? json,
          requestId: (envelope?.requestId as string | undefined) ?? responseRequestId,
          headers: responseHeaders,
          retryAfterMs: response.status === 429 ? parseRetryAfterMs(responseHeaders) : null,
        });
        // Clear local auth state to prevent stale token reuse (F06 G: backend has no access-token blocklist)
        // Only if not skipAuthRefresh to avoid double-clear on logout call
        if (!skipAuthRefresh || path.includes("/auth/refresh")) {
          this.tokenStore.clear();
        }
        if (!skipAuthRefresh) {
          this.onAuthFailure?.(apiError);
        }
        if (parseFailed) {
          throw new ParseError(envelope?.error?.message ?? response.statusText, responseRequestId, responseHeaders, json);
        }
        throw apiError;
      }

      // Special: 401 -> attempt single-flight refresh once (F06 C/D)
      const isAuthRefreshEndpoint = path.includes("/auth/refresh");
      const shouldAttemptRefresh =
        response.status === 401 && !skipAuthRefresh && !_retried && !isAuthRefreshEndpoint;

      // Only attempt refresh for eligible codes or generic 401
      const isRefreshEligible = !normalizedCode || REFRESH_ELIGIBLE_CODES.has(normalizedCode) || normalizedCode === "UNAUTHORIZED";

      if (shouldAttemptRefresh && isRefreshEligible) {
        const refreshed = await this.handleRefresh();
        if (refreshed) {
          // Retry exactly once with new token and same request (preserve method/body)
          return this.requestEnvelope<T>(path, {
            ...options,
            _retried: true,
          });
        }
        // Refresh failed — surface original 401 after onAuthFailure (handleRefresh already cleared + notified)
      }

      // Also handle 403 forced logout that is not in FORCED_LOGOUT_CODES but indicates auth failure
      // e.g., generic 403 with tenant inactive — already handled above via code check

      const backendMessage = envelope?.error?.message ?? (typeof json === "string" ? json : null) ?? response.statusText;
      const details = (envelope?.error as unknown) ?? json;
      const retryAfterMs = response.status === 429 ? parseRetryAfterMs(responseHeaders) : null;

      const apiError = toApiError({
        status: response.status,
        backendCode,
        message: backendMessage,
        details,
        requestId: (envelope?.requestId as string | undefined) ?? responseRequestId,
        headers: responseHeaders,
        retryAfterMs,
      });

      // 403 TENANT_INACTIVE / PLATFORM_ACCESS_DENIED should also trigger forced logout even without 401
      // They are already handled above via FORCED_LOGOUT_CODES, but add fallback for status-based
      this.handleForcedLogoutIfNeeded(apiError, skipAuthRefresh);

      if (parseFailed) {
        throw new ParseError(backendMessage, responseRequestId, responseHeaders, json);
      }

      throw apiError;
    }

    // Success path — expect envelope {success:true, data:...}
    if (json !== null && typeof json === "object" && "success" in (json as Record<string, unknown>)) {
      const env = json as SuccessEnvelope<T> & { requestId?: string };
      if (!env.requestId) env.requestId = responseRequestId;
      if ((env as unknown as { success: boolean }).success === false) {
        const errEnv = json as unknown as { error?: { code?: string; message?: string }; requestId?: string };
        throw toApiError({
          status: response.status,
          backendCode: errEnv.error?.code ?? null,
          message: errEnv.error?.message ?? "Request failed.",
          details: errEnv.error,
          requestId: errEnv.requestId ?? responseRequestId,
          headers: responseHeaders,
        });
      }
      return env as SuccessEnvelope<T>;
    }

    if (parseFailed) {
      throw new ParseError("Unexpected response format.", responseRequestId, responseHeaders, json);
    }
    return {
      success: true,
      data: json as T,
      requestId: responseRequestId,
    };
  }

  private handleForcedLogoutIfNeeded(apiError: ApiError, skipAuthRefresh: boolean): void {
    if (skipAuthRefresh) return;
    const code = (apiError.code ?? "").toUpperCase();
    // Check forced logout set or specific status+code combos
    if (FORCED_LOGOUT_CODES.has(code)) {
      this.tokenStore.clear();
      this.onAuthFailure?.(apiError);
      return;
    }
    // 403 with TENANT_INACTIVE / PLATFORM_ACCESS_DENIED already covered, but also handle raw codes
    if (apiError.status === 403 && (code === "TENANT_INACTIVE" || code === "PLATFORM_ACCESS_DENIED" || code === "FORBIDDEN")) {
      // Only treat TENANT_INACTIVE / PLATFORM_ACCESS_DENIED as forced logout, not generic 403 permission denials
      // Generic permission 403 should NOT logout. So check strictly.
      if (code === "TENANT_INACTIVE" || code === "PLATFORM_ACCESS_DENIED") {
        this.tokenStore.clear();
        this.onAuthFailure?.(apiError);
      }
      return;
    }
    if (apiError.status === 401 && !skipAuthRefresh) {
      // For generic 401, onAuthFailure is handled via refresh path; only call if we are not retrying
      // This is called for non-refresh-eligible 401s (like USER_NOT_FOUND already handled)
      // No-op for eligible ones — handleRefresh will decide
    }
  }

  // -------------------------------------------------------------------------
  // Refresh handling — deduplicated, exactly once per burst (F06 C)
  // -------------------------------------------------------------------------

  private async handleRefresh(): Promise<boolean> {
    const refreshToken = this.tokenStore.getRefreshToken();
    if (!refreshToken) return false;

    // Deduplicate concurrent refreshes — single-flight promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Capture scope before refresh to detect scope switching
    const scopeBefore = this.tokenStore.getScope();

    this.refreshPromise = (async () => {
      try {
        const url = `${this.baseUrl}/auth/refresh`;
        const res = await this.fetchImpl(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            [apiConfig.headers.requestId]: generateRequestId(),
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
          // Parse error code for forced logout
          let errorCode: string | null = null;
          try {
            const errBody = (await res.json()) as { error?: { code?: string } };
            errorCode = errBody?.error?.code ?? null;
          } catch {
            // ignore parse
          }
          const normalized = errorCode ? errorCode.toUpperCase() : null;
          // Refresh failed — clear tokens to prevent stale refresh-token usage
          this.tokenStore.clear();
          const apiError = toApiError({
            status: res.status,
            backendCode: normalized,
            message: normalized ?? res.statusText,
            details: null,
            requestId: res.headers.get(apiConfig.headers.requestId) ?? null,
            headers: headersToRecord(res.headers),
          });
          this.onAuthFailure?.(apiError);
          return false;
        }

        const body = (await res.json()) as SuccessEnvelope<{
          accessToken: string;
          refreshToken: string;
          sessionId?: string;
          scope?: string;
          user?: unknown;
        }>;
        // Handle both envelope and direct shapes
        const data = (body as unknown as { data?: Record<string, unknown> })?.data ?? (body as unknown as Record<string, unknown>);
        const accessToken = (data as { accessToken?: string })?.accessToken;
        const nextRefresh = (data as { refreshToken?: string })?.refreshToken;
        const sessionId = (data as { sessionId?: string })?.sessionId ?? null;
        const returnedScope = (data as { scope?: string })?.scope ?? (data as { user?: { scope?: string } })?.user?.scope ?? null;
        const user = (data as { user?: unknown })?.user ?? null;

        if (typeof accessToken === "string" && typeof nextRefresh === "string") {
          // Scope preservation check — MUST NOT allow scope switching (F06 H)
          if (scopeBefore && returnedScope && scopeBefore !== returnedScope) {
            // Scope switching attempt — force logout for security
            this.tokenStore.clear();
            const err = toApiError({
              status: 401,
              backendCode: "INVALID_REFRESH_TOKEN",
              message: "Scope mismatch during refresh — session terminated for security",
              requestId: null,
              headers: {},
            });
            this.onAuthFailure?.(err);
            return false;
          }
          const scopeToStore = returnedScope ?? scopeBefore ?? null;
          this.tokenStore.setTokens({
            accessToken,
            refreshToken: nextRefresh,
            scope: scopeToStore,
            sessionId: typeof sessionId === "string" ? sessionId : null,
            user: user ?? undefined,
          });
          // Emit event so socket can reconnect with new token (F06 I)
          if (typeof window !== "undefined") {
            try {
              window.dispatchEvent(new CustomEvent("pulseops:token-refreshed", { detail: { accessToken, scope: scopeToStore } }));
            } catch {
              // ignore
            }
          }
          return true;
        }
        if (typeof accessToken === "string") {
          // Fallback: backend rotated only access — keep old refresh but update access
          this.tokenStore.setAccessToken(accessToken);
          if (sessionId && typeof sessionId === "string") {
            this.tokenStore.setSessionId(sessionId);
          }
          return true;
        }
        // Unexpected shape
        this.tokenStore.clear();
        const err = toApiError({
          status: res.status,
          backendCode: "INVALID_REFRESH_TOKEN",
          message: "Invalid refresh response",
          requestId: null,
          headers: {},
        });
        this.onAuthFailure?.(err);
        return false;
      } catch {
        this.tokenStore.clear();
        const err = toApiError({
          status: 401,
          backendCode: "INVALID_REFRESH_TOKEN",
          message: "Refresh failed",
          requestId: null,
          headers: {},
        });
        this.onAuthFailure?.(err);
        return false;
      } finally {
        const p = this.refreshPromise;
        queueMicrotask(() => {
          if (this.refreshPromise === p) this.refreshPromise = null;
        });
      }
    })();

    return this.refreshPromise;
  }

  /**
   * For testing: expose whether a refresh is in-flight
   */
  get isRefreshing(): boolean {
    return this.refreshPromise !== null;
  }
}

// Default singleton — components import from @/lib/api and use apiClient.* or feature modules
export const apiClient = new ApiClient();

export function createApiClient(opts: ApiClientOptions): ApiClient {
  return new ApiClient(opts);
}
