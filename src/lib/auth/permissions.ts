/**
 * RBAC Permission Catalogue — F07
 * Backend is authoritative. Catalogue derived from verified backend:
 *  - prisma/seed.js SYSTEM_PERMISSIONS (41 tenant)
 *  - plus verified routes that use dashboard:read, analytics:read, attribute:* (4)
 *  - Total verified distinct tenant permissions used by backend routes: 42-48 depending on tenant:* legacy.
 * Spec says: 42 tenant + 6 platform — we expose exact strings used by backend `authorize()` / seed.
 * UI must NOT invent permissions; when backend adds/removes, GET /permissions is the live inventory.
 * Grouping is presentation-only.
 */

export type PermissionName = string;
export type RoleName = string;

/** All tenant permissions currently seeded + authorized in backend (union). */
export const TENANT_PERMISSIONS: readonly string[] = [
  // Users & Tenants
  "tenant:read",
  "tenant:update",
  // Users
  "user:create",
  "user:read",
  "user:update",
  "user:delete",
  // Roles / Permissions
  "role:create",
  "role:read",
  "role:update",
  "role:delete",
  "permission:read",
  // Catalog
  "product:create",
  "product:read",
  "product:update",
  "product:delete",
  "category:create",
  "category:read",
  "category:update",
  "category:delete",
  "attribute:create",
  "attribute:read",
  "attribute:update",
  "attribute:delete",
  // Operations
  "warehouse:create",
  "warehouse:read",
  "warehouse:update",
  "warehouse:delete",
  "inventory:read",
  "inventory:update",
  "order:create",
  "order:read",
  "order:update",
  "order:cancel",
  "payment:create",
  "payment:read",
  "payment:confirm",
  "payment:refund",
  // Customers (implied via orders, still seeded)
  "customer:create",
  "customer:read",
  "customer:update",
  "customer:delete",
  // Cross-cutting
  "audit:read",
  "activity:read",
  "notification:read",
  "notification:update",
  "dashboard:read",
  "analytics:read",
  // Background jobs, reports, message templates
  "jobs:read",
  "jobs:manage",
  "report:create",
  "report:read",
  "notification_template:create",
  "notification_template:read",
  "notification_template:update",
  "notification_template:delete",
] as const;

export const PLATFORM_PERMISSIONS: readonly string[] = [
  "platform:tenant:create",
  "platform:tenant:read",
  "platform:tenant:update",
  "platform:tenant:suspend",
  "platform:tenant:delete",
  "platform:tenant:access",
  "platform:billing:read",
  "platform:billing:update",
  "platform:admin:read",
  "platform:admin:manage",
  "platform:audit:read",
] as const;

/** Backend system roles — tenant scope */
export const SYSTEM_ROLES = ["admin", "manager", "member"] as const;
export const PLATFORM_SYSTEM_ROLE = "platform_admin" as const;

/** Resource grouping for UI presentation (additive, not authoritative). */
export interface PermissionGroup {
  label: string;
  resource: string;
  permissions: string[];
  description: string;
}

export const TENANT_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: "Users & Access",
    resource: "user",
    permissions: ["user:create", "user:read", "user:update", "user:delete", "role:create", "role:read", "role:update", "role:delete", "permission:read"],
    description: "Manage users, roles and permissions",
  },
  {
    label: "Tenant",
    resource: "tenant",
    permissions: ["tenant:read", "tenant:update"],
    description: "Tenant configuration",
  },
  {
    label: "Catalog",
    resource: "catalog",
    permissions: [
      "product:create",
      "product:read",
      "product:update",
      "product:delete",
      "category:create",
      "category:read",
      "category:update",
      "category:delete",
      "attribute:create",
      "attribute:read",
      "attribute:update",
      "attribute:delete",
    ],
    description: "Products, categories and attributes",
  },
  {
    label: "Inventory & Warehouse",
    resource: "warehouse",
    permissions: ["warehouse:create", "warehouse:read", "warehouse:update", "warehouse:delete", "inventory:read", "inventory:update"],
    description: "Warehouses and stock movements",
  },
  {
    label: "Orders & Payments",
    resource: "order",
    permissions: ["order:create", "order:read", "order:update", "order:cancel", "payment:create", "payment:read", "payment:confirm", "payment:refund"],
    description: "Order lifecycle and payments",
  },
  {
    label: "Customers",
    resource: "customer",
    permissions: ["customer:create", "customer:read", "customer:update", "customer:delete"],
    description: "Customer records (via orders)",
  },
  {
    label: "Analytics & Dashboard",
    resource: "analytics",
    permissions: ["dashboard:read", "analytics:read"],
    description: "Dashboards and reporting",
  },
  {
    label: "Audit & Notifications",
    resource: "audit",
    permissions: ["audit:read", "activity:read", "notification:read", "notification:update"],
    description: "Audits, activity and notifications",
  },
  {
    label: "Reports",
    resource: "report",
    permissions: ["report:create", "report:read"],
    description: "CSV exports and report schedules (each export also needs read access to its data)",
  },
  {
    label: "Message templates",
    resource: "notification_template",
    permissions: ["notification_template:create", "notification_template:read", "notification_template:update", "notification_template:delete"],
    description: "Wording of emails, SMS and in-app messages",
  },
  {
    label: "Background jobs",
    resource: "jobs",
    permissions: ["jobs:read", "jobs:manage"],
    description: "Job status and manual triggers",
  },
];

export const PLATFORM_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: "Platform Tenants",
    resource: "platform:tenant",
    permissions: ["platform:tenant:create", "platform:tenant:read", "platform:tenant:update", "platform:tenant:suspend"],
    description: "Manage tenants in the control plane",
  },
  {
    label: "Platform Billing",
    resource: "platform:billing",
    permissions: ["platform:billing:read", "platform:billing:update"],
    description: "Billing and subscriptions",
  },
];

/**
 * Pure helpers — no React, no I/O. Centralized so PermissionContext/Guards share logic.
 */
export function normalizePermission(p: string): string {
  return p.trim().toLowerCase();
}

export function hasPermission(permissions: Set<string> | string[], permission: string): boolean {
  const normalized = normalizePermission(permission);
  if (Array.isArray(permissions)) return permissions.some((p) => normalizePermission(p) === normalized);
  return permissions.has(normalized);
}

export function hasAnyPermission(permissions: Set<string> | string[], required: string[]): boolean {
  if (required.length === 0) return true;
  return required.some((p) => hasPermission(permissions, p));
}

export function hasAllPermissions(permissions: Set<string> | string[], required: string[]): boolean {
  if (required.length === 0) return true;
  return required.every((p) => hasPermission(permissions, p));
}

export function hasRole(roles: Set<string> | string[], role: string): boolean {
  const n = normalizePermission(role);
  if (Array.isArray(roles)) return roles.some((r) => normalizePermission(r) === n);
  return roles.has(n);
}

export function hasAnyRole(roles: Set<string> | string[], required: string[]): boolean {
  if (required.length === 0) return true;
  return required.some((r) => hasRole(roles, r));
}

export function hasAllRoles(roles: Set<string> | string[], required: string[]): boolean {
  if (required.length === 0) return true;
  return required.every((r) => hasRole(roles, r));
}

/** Union permissions from roles (each role.permissions[]). Backend-each role has permissions[]. */
export function unionPermissionsFromRoles(roles: Array<{ permissions?: Array<{ name?: string; resource?: string; action?: string }> | string[] }>): string[] {
  const set = new Set<string>();
  for (const role of roles) {
    const perms = role.permissions ?? [];
    for (const p of perms) {
      if (typeof p === "string") set.add(normalizePermission(p));
      else if (p && typeof p === "object") {
        if ("name" in p && typeof p.name === "string") set.add(normalizePermission(p.name));
        else if ("resource" in p && "action" in p) set.add(normalizePermission(`${(p as { resource: string }).resource}:${(p as { action: string }).action}`));
      }
    }
  }
  return Array.from(set);
}

/** Display helpers */
export function permissionLabel(p: string): string {
  // "product:create" -> "Create products"
  const [resource, action] = p.split(":");
  if (!resource || !action) return p;
  const r = resource.replace("platform:", "").replace(/_/g, " ");
  return `${action.charAt(0).toUpperCase() + action.slice(1)} ${r}`;
}

export function groupPermissionsByResource(permissions: Array<{ name: string; resource: string; action: string }>): Record<string, typeof permissions> {
  const out: Record<string, typeof permissions> = {};
  for (const p of permissions) {
    if (!out[p.resource]) out[p.resource] = [];
    out[p.resource].push(p);
  }
  return out;
}
