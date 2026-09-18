/**
 * PulseOps API — central barrel — F04
 * Re-exports client, config, errors, tokens, query/pagination, types, and all
 * feature modules. Pages/components must import from "@/lib/api" — never use
 * direct fetch("http://localhost:3000/...").
 */

export { apiConfig } from "./config";
export { ApiClient, apiClient, createApiClient } from "./client";
export type { HttpMethod, RequestOptions, ApiClientOptions } from "./client";

export {
  ApiError,
  NetworkError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitedError,
  ServerError,
  ParseError,
  toApiError,
  parseRetryAfterMs,
} from "./errors";
export type { ApiErrorCode, ApiErrorDetails } from "./errors";

export { tokenStore } from "./tokens";
export type { TokenStore } from "./tokens";

export { serializeQuery, buildUrl } from "./query";
export type { QueryParams, QueryValue } from "./query";

export { normalizePagination, hasNextPage, hasPrevPage } from "./pagination";
export type { PaginationParams, PaginationMeta, SortParams, SearchParams, PaginatedQuery } from "./pagination";

export type { SuccessEnvelope, ErrorEnvelope, ApiEnvelope } from "./types";

// Feature modules
export { healthApi } from "./modules/health";
export { authApi } from "./modules/auth";
export { tenantsApi } from "./modules/tenants";
export { usersApi } from "./modules/users";
export { rolesApi } from "./modules/roles";
export { permissionsApi } from "./modules/permissions";
export { categoriesApi } from "./modules/categories";
export { productsApi } from "./modules/products";
export { variantsApi } from "./modules/variants";
export { attributesApi } from "./modules/attributes";
export { warehousesApi } from "./modules/warehouses";
export { inventoryApi } from "./modules/inventory";
export { ordersApi } from "./modules/orders";
export { paymentsApi } from "./modules/payments";
export { dashboardApi } from "./modules/dashboard";
export { analyticsApi } from "./modules/analytics";
export { notificationsApi } from "./modules/notifications";
export { auditApi } from "./modules/audit";
export { jobsApi } from "./modules/jobs";
export { productImagesApi, storageApi } from "./modules/storage";
