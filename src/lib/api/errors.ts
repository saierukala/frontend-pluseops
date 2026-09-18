/**
 * Centralized error normalization — F04
 * UI code should never need to parse raw fetch errors. All transport failures
 * are mapped to typed ApiError subclasses.
 */

export type ApiErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "PARSE_ERROR"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "TOKEN_EXPIRED"
  | "INVALID_TOKEN"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYLOAD_TOO_LARGE"
  | "SERVER_ERROR"
  | "UNKNOWN_ERROR";

export interface ApiErrorDetails {
  status: number;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string | null;
  headers?: Record<string, string>;
  retryAfterMs?: number | null;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly requestId?: string | null;
  readonly headers?: Record<string, string>;
  readonly retryAfterMs?: number | null;
  override readonly cause?: unknown;

  constructor(opts: ApiErrorDetails & { cause?: unknown }) {
    super(opts.message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
    this.requestId = opts.requestId ?? null;
    this.headers = opts.headers;
    this.retryAfterMs = opts.retryAfterMs ?? null;
    this.cause = opts.cause;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }
  isUnauthorized(): boolean {
    return this.status === 401;
  }
  isForbidden(): boolean {
    return this.status === 403;
  }
  isConflict(): boolean {
    return this.status === 409;
  }
  isRateLimited(): boolean {
    return this.status === 429;
  }
  isValidation(): boolean {
    return this.code === "VALIDATION_ERROR" || this.status === 400;
  }
}

export class NetworkError extends ApiError {
  constructor(message = "Network error. Please check your connection.", opts?: Partial<ApiErrorDetails>) {
    super({
      status: 0,
      code: "NETWORK_ERROR",
      message,
      requestId: opts?.requestId ?? null,
      cause: opts?.cause,
    });
    this.name = "NetworkError";
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown, requestId?: string | null, headers?: Record<string, string>) {
    super({ status: 400, code: "VALIDATION_ERROR", message, details, requestId, headers });
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string, code = "UNAUTHORIZED", details?: unknown, requestId?: string | null, headers?: Record<string, string>) {
    super({ status: 401, code, message, details, requestId, headers });
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string, details?: unknown, requestId?: string | null, headers?: Record<string, string>) {
    super({ status: 403, code: "FORBIDDEN", message, details, requestId, headers });
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string, details?: unknown, requestId?: string | null, headers?: Record<string, string>) {
    super({ status: 404, code: "NOT_FOUND", message, details, requestId, headers });
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: unknown, requestId?: string | null, headers?: Record<string, string>) {
    super({ status: 409, code: "CONFLICT", message, details, requestId, headers });
    this.name = "ConflictError";
  }
}

export class RateLimitedError extends ApiError {
  constructor(message: string, retryAfterMs: number | null, requestId?: string | null, headers?: Record<string, string>) {
    super({ status: 429, code: "RATE_LIMITED", message, requestId, headers, retryAfterMs });
    this.name = "RateLimitedError";
  }
}

export class ServerError extends ApiError {
  constructor(message: string, status: number, code: string, details?: unknown, requestId?: string | null, headers?: Record<string, string>) {
    super({ status, code, message, details, requestId, headers });
    this.name = "ServerError";
  }
}

export class ParseError extends ApiError {
  constructor(message: string, requestId?: string | null, headers?: Record<string, string>, cause?: unknown) {
    super({ status: 200, code: "PARSE_ERROR", message, requestId, headers, cause, details: cause });
    this.name = "ParseError";
  }
}

/**
 * Factory: map status + backend error envelope to typed error.
 * Backend error shape: {success:false, error:{code,message,details}, requestId}
 */
export function toApiError(args: {
  status: number;
  backendCode?: string | null;
  message?: string | null;
  details?: unknown;
  requestId?: string | null;
  headers?: Record<string, string>;
  retryAfterMs?: number | null;
}): ApiError {
  const status = args.status;
  const code = (args.backendCode ?? "").toUpperCase();
  const message = args.message ?? fallbackMessage(status, code);
  const headers = args.headers;
  const requestId = args.requestId ?? null;
  const details = args.details;
  const retryAfterMs = args.retryAfterMs ?? null;

  if (status === 429) {
    return new RateLimitedError(message, retryAfterMs, requestId, headers);
  }
  if (status === 401) {
    // Preserve backend code for refresh logic (TOKEN_EXPIRED vs INVALID_TOKEN etc.)
    const mappedCode = code || "UNAUTHORIZED";
    return new UnauthorizedError(message, mappedCode, details, requestId, headers);
  }
  if (status === 403) return new ForbiddenError(message, details, requestId, headers);
  if (status === 404) return new NotFoundError(message, details, requestId, headers);
  if (status === 409) return new ConflictError(message, details, requestId, headers);
  if (status === 400 && (code === "VALIDATION_ERROR" || code === "INVALID_JSON")) {
    return new ValidationError(message, details, requestId, headers);
  }
  if (status === 400) {
    // Business 400s (INSUFFICIENT_STOCK etc.) — keep backend code
    return new ValidationError(message, details, requestId, headers);
  }
  if (status === 413) {
    return new ApiError({ status, code: code || "PAYLOAD_TOO_LARGE", message, details, requestId, headers });
  }
  if (status === 422) {
    return new ValidationError(message, details, requestId, headers);
  }
  if (status >= 500) {
    return new ServerError(message, status, code || "SERVER_ERROR", details, requestId, headers);
  }
  return new ApiError({ status, code: code || "UNKNOWN_ERROR", message, details, requestId, headers });
}

function fallbackMessage(status: number, code: string): string {
  if (code) return code;
  if (status === 429) return "Too many requests. Please try again shortly.";
  if (status === 401) return "Authentication required.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "Resource not found.";
  if (status === 409) return "Conflict — resource already exists.";
  if (status === 400) return "Invalid request.";
  if (status >= 500) return "An unexpected error occurred.";
  return "Request failed.";
}

export function parseRetryAfterMs(headers: Record<string, string>): number | null {
  // Retry-After may be seconds or HTTP-date. Prefer seconds.
  const raw = headers["retry-after"] ?? headers["Retry-After"] ?? null;
  if (!raw) return null;
  const secs = Number(raw);
  if (Number.isFinite(secs) && secs >= 0) return secs * 1000;
  // Try HTTP-date
  const dateMs = Date.parse(raw);
  if (!Number.isNaN(dateMs)) {
    const diff = dateMs - Date.now();
    return diff > 0 ? diff : 0;
  }
  return null;
}
