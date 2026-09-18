/**
 * Pagination types & helpers — F04
 * Backend envelope: {success:true, data:[], meta:{page,limit,total,totalPages}}
 * Defaults: page 1, limit 20 (max 100) unless noted (roles default 50).
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SearchParams {
  search?: string;
}

export type PaginatedQuery = PaginationParams & SortParams & SearchParams & Record<string, unknown>;

export function normalizePagination(params: PaginationParams): Required<PaginationParams> {
  return {
    page: Math.max(1, Math.trunc(params.page ?? 1)),
    limit: Math.min(100, Math.max(1, Math.trunc(params.limit ?? 20))),
  };
}

export function hasNextPage(meta: PaginationMeta): boolean {
  return meta.page < meta.totalPages;
}

export function hasPrevPage(meta: PaginationMeta): boolean {
  return meta.page > 1;
}
