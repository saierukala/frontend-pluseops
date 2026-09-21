/**
 * Shared API types — F04
 * Mirrors backend envelope (handoff §3) without inventing fields.
 */

import type { PaginationMeta } from "./pagination";

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
  requestId?: string;
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

export type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

// Common entity timestamps (backend uses created_at/updatedAt ISO strings)
export type IsoDateString = string;

// Generic ID type
export type Uuid = string;

// Pagination utility re-export
export type { PaginationMeta, PaginationParams } from "./pagination";

// ---------------------------------------------------------------------------
// Domain stubs — minimal shapes typed from handoff + OpenAPI.
// Full domain types are progressively refined per feature; F04 keeps them
// generic so we do not invent fields. Feature modules narrow as needed.
// ---------------------------------------------------------------------------

export interface Tenant {
  id: Uuid;
  name: string;
  slug: string;
  status: "ACTIVE" | "SUSPENDED" | "TRIAL" | "CANCELLED";
  plan: string;
  created_at?: IsoDateString;
  updated_at?: IsoDateString;
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
}

export type AuthScope = "platform" | "tenant";

export interface User {
  id: Uuid;
  tenantId: Uuid;
  email: string;
  firstName: string;
  lastName: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  emailVerified: boolean;
  lastLoginAt?: IsoDateString | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  scope?: AuthScope;
  roles?: Array<{ id: Uuid; name: string; isSystem: boolean }>;
}

export interface Role {
  id: Uuid;
  tenantId: Uuid;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions?: Permission[];
  userCount?: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface Permission {
  id: Uuid;
  tenantId: Uuid;
  name: string;
  resource: string;
  action: string;
  description?: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface Category {
  id: Uuid;
  tenantId: Uuid;
  parentId?: Uuid | null;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface Product {
  id: Uuid;
  tenantId: Uuid;
  name: string;
  description?: string | null;
  brand?: string | null;
  status: "ACTIVE" | "INACTIVE" | "DRAFT" | "ARCHIVED";
  basePrice?: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  deletedAt?: IsoDateString | null;
}

export interface ProductVariant {
  id: Uuid;
  tenantId: Uuid;
  productId: Uuid;
  sku: string;
  barcode?: string | null;
  price: string;
  costPrice?: string | null;
  status: "ACTIVE" | "INACTIVE" | "DRAFT";
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface Warehouse {
  id: Uuid;
  tenantId: Uuid;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface HealthStatus {
  status: string;
  name?: string;
}
