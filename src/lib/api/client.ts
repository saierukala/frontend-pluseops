/**
 * Central API client — F04
 * Flow: Component -> Feature API -> Central API Client -> Backend
 *
 * Responsibilities:
 * - Base URL from env (NEXT_PUBLIC_API_BASE_URL)
 * - Authorization header (Bearer access token)
 * - Request/correlation ID (X-Request-Id generate + echo)
 * - JSON parsing + envelope handling
 * - Centralized error normalization
 * - 401 -> refresh token once (deduplicated) -> retry once
 * - 429 handling (Retry-After surfaced, no auto-retry)
 * - Timeout + abort
 * - Pagination/query wired via helpers but not assumed
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
    // crypto.randomUUID is available in modern browsers + Node 19+
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
    // Date to ISO
    if (v instanceof Date) {
      sp.append(k, v.toISOString());
      continue;
    }
    sp.append(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${path}${path.includes("?") ? "&" : "?"}${qs}` : path;
}

export class ApiClient {
  readonly baseUrl: string;
  readonly tokenStore: TokenStore;
  readonly onAuthFailure?: (error: ApiError) => void;
  private readonly fetchImpl: typeof fetch;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(opts: ApiClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? apiConfig.baseUrl).replace(/\/+$/, "");
    this.tokenStore = opts.tokenStore ?? defaultTokenStore;
    this.onAuthFailure = opts.onAuthFailure;
    this.fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
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
      // Do not set Content-Type — browser/Node will set multipart boundary.
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

    // Authorization
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
        // Remove JSON content-type for multipart
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
          // Merge external abort with timeout abort
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
        // Try to parse error envelope even for raw endpoints
        const text = await response.text().catch(() => "");
        let parsed: unknown = null;
        try {
          parsed = text ? (JSON.parse(text) as unknown) : null;
        } catch {
          parsed = null;
        }
        const p = parsed as { error?: { code?: string; message?: string }; requestId?: string } | null;
        const retryAfterMs = response.status === 429 ? parseRetryAfterMs(responseHeaders) : null;
        throw toApiError({
          status: response.status,
          backendCode: p?.error?.code ?? null,
          message: p?.error?.message ?? text ?? response.statusText,
          details: (p?.error as unknown) ?? parsed,
          requestId: p?.requestId ?? responseRequestId,
          headers: responseHeaders,
          retryAfterMs,
        });
      }
      // Caller handles blob/stream — return envelope-like for type compat
      // but raw path bypasses envelope parsing.
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
            // Non-JSON success (e.g. text) — treat as data if 2xx else parse error handling below
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
      // Special: 401 -> attempt refresh once
      const isAuthRefreshEndpoint = path.includes("/auth/refresh");
      const shouldAttemptRefresh =
        response.status === 401 && !skipAuthRefresh && !_retried && !isAuthRefreshEndpoint;

      if (shouldAttemptRefresh) {
        const refreshed = await this.handleRefresh();
        if (refreshed) {
          // Retry exactly once with new token and same request (preserve method/body)
          return this.requestEnvelope<T>(path, {
            ...options,
            _retried: true,
          });
        }
        // Refresh failed — surface original 401 after onAuthFailure
      }

      // Normalize to typed error
      const envelope = json as { success?: boolean; error?: { code?: string; message?: string; details?: unknown }; requestId?: string } | null;
      const backendCode = envelope?.error?.code ?? null;
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

      if (response.status === 401 && !skipAuthRefresh) {
        this.onAuthFailure?.(apiError);
      }

      if (parseFailed) {
        throw new ParseError(backendMessage, responseRequestId, responseHeaders, json);
      }

      throw apiError;
    }

    // Success path — expect envelope {success:true, data:...}
    if (json !== null && typeof json === "object" && "success" in (json as Record<string, unknown>)) {
      const env = json as SuccessEnvelope<T> & { requestId?: string };
      // Preserve requestId from header if body misses it
      if (!env.requestId) env.requestId = responseRequestId;
      // Basic validation: success must be true here (we already checked !ok)
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

    // Backend returned raw data without envelope (e.g. health) — wrap it
    if (parseFailed) {
      throw new ParseError("Unexpected response format.", responseRequestId, responseHeaders, json);
    }
    return {
      success: true,
      data: json as T,
      requestId: responseRequestId,
    };
  }

  // -------------------------------------------------------------------------
  // Refresh handling — deduplicated, exactly once per burst
  // -------------------------------------------------------------------------

  private async handleRefresh(): Promise<boolean> {
    const refreshToken = this.tokenStore.getRefreshToken();
    if (!refreshToken) return false;

    // Deduplicate concurrent refreshes
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        // Direct fetch to avoid recursion through requestEnvelope intercept
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
          // Refresh failed — clear tokens to prevent retry loop
          this.tokenStore.clear();
          return false;
        }

        const body = (await res.json()) as SuccessEnvelope<{
          accessToken: string;
          refreshToken: string;
        }>;
        const newAccess = (body as unknown as { data?: { accessToken?: string } })?.data?.accessToken;
        const newRefresh = (body as unknown as { data?: { refreshToken?: string } })?.data?.refreshToken;

        // Backend returns {success:true,data:{accessToken,refreshToken,...}} — handle both shapes
        const accessToken = newAccess ?? (body as unknown as { accessToken?: string })?.accessToken;
        const nextRefresh = newRefresh ?? (body as unknown as { refreshToken?: string })?.refreshToken;

        if (typeof accessToken === "string" && typeof nextRefresh === "string") {
          this.tokenStore.setTokens({ accessToken, refreshToken: nextRefresh });
          return true;
        }
        if (typeof accessToken === "string") {
          // Some backends rotate only access — keep old refresh
          this.tokenStore.setAccessToken(accessToken);
          return true;
        }
        // Unexpected shape
        this.tokenStore.clear();
        return false;
      } catch {
        this.tokenStore.clear();
        return false;
      } finally {
        // Allow next refresh after a short microtask to avoid tight loop
        // but clear promise so future 401s can attempt again (user may have re-logged)
        const p = this.refreshPromise;
        // Defer clearing to avoid race where concurrent callers still await
        queueMicrotask(() => {
          if (this.refreshPromise === p) this.refreshPromise = null;
        });
      }
    })();

    return this.refreshPromise;
  }
}

// Default singleton — components import from @/lib/api and use apiClient.* or feature modules
export const apiClient = new ApiClient();

export function createApiClient(opts: ApiClientOptions): ApiClient {
  return new ApiClient(opts);
}
