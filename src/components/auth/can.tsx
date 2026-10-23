"use client";

import * as React from "react";
import { usePermission } from "@/lib/auth/permission-context";

export interface CanProps {
  permission?: string;
  role?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
  anyRoles?: string[];
  allRoles?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Can — conditional render based on permission/role.
 * Usage:
 *   <Can permission="product:create">...</Can>
 *   <Can anyPermissions={["product:create","product:update"]} fallback={<span>no</span>}>...</Can>
 * Fail closed: while loading, renders nothing (no flash).
 */
export function Can({ permission, role, anyPermissions, allPermissions, anyRoles, allRoles, children, fallback = null }: CanProps) {
  const { hasPermission, hasRole, hasAnyPermission, hasAllPermissions, hasAnyRole, hasAllRoles, isReady, isLoading } = usePermission();

  if (!isReady || isLoading) return null;

  let allowed = false;
  if (permission) allowed = hasPermission(permission);
  else if (role) allowed = hasRole(role);
  else if (anyPermissions) allowed = hasAnyPermission(anyPermissions);
  else if (allPermissions) allowed = hasAllPermissions(allPermissions);
  else if (anyRoles) allowed = hasAnyRole(anyRoles);
  else if (allRoles) allowed = hasAllRoles(allRoles);

  return allowed ? <>{children}</> : <>{fallback}</>;
}

/**
 * useCan hook for imperative checks:
 * const canCreate = useCanCheck({ permission: "product:create" })
 */
export function useCanCheck(props: Omit<CanProps, "children" | "fallback">): boolean {
  const { hasPermission, hasRole, hasAnyPermission, hasAllPermissions, hasAnyRole, hasAllRoles, isReady, isLoading } = usePermission();
  if (!isReady || isLoading) return false;
  if (props.permission) return hasPermission(props.permission);
  if (props.role) return hasRole(props.role);
  if (props.anyPermissions) return hasAnyPermission(props.anyPermissions);
  if (props.allPermissions) return hasAllPermissions(props.allPermissions);
  if (props.anyRoles) return hasAnyRole(props.anyRoles);
  if (props.allRoles) return hasAllRoles(props.allRoles);
  return false;
}
