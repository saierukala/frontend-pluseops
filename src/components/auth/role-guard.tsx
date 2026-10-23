"use client";

import * as React from "react";
import { usePermission } from "@/lib/auth/permission-context";
import { Skeleton } from "@/components/ui/skeleton";

interface RoleGuardProps {
  children: React.ReactNode;
  role?: string;
  anyRoles?: string[];
  allRoles?: string[];
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

/**
 * RoleGuard — mirrors PermissionGuard for roles. Uses backend role names exactly.
 * Fail closed while loading.
 */
export function RoleGuard({ children, role, anyRoles, allRoles, fallback = null, loadingFallback }: RoleGuardProps) {
  const { hasRole, hasAnyRole, hasAllRoles, isLoading, isReady } = usePermission();

  if (!isReady || isLoading) {
    return (
      <>
        {loadingFallback ?? (
          <div aria-busy="true" aria-live="polite" className="space-y-2 p-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
      </>
    );
  }

  let allowed = false;
  if (role) allowed = hasRole(role);
  else if (anyRoles) allowed = hasAnyRole(anyRoles);
  else if (allRoles) allowed = hasAllRoles(allRoles);

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
