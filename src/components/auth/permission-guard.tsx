"use client";

import * as React from "react";
import { usePermission } from "@/lib/auth/permission-context";
import { Skeleton } from "@/components/ui/skeleton";

interface PermissionGuardProps {
  children: React.ReactNode;
  /** Single permission — e.g., "product:create" */
  permission?: string;
  /** Any of these grants access */
  anyPermissions?: string[];
  /** All of these required */
  allPermissions?: string[];
  /** Fallback when denied */
  fallback?: React.ReactNode;
  /** Custom loading fallback */
  loadingFallback?: React.ReactNode;
}

/**
 * PermissionGuard — fail closed, shows fallback or null when unauthorized.
 * Avoid protected UI flashing before authorization ready → shows loading state.
 */
export function PermissionGuard({
  children,
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
  loadingFallback,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading, isReady } = usePermission();

  if (!isReady || isLoading) {
    return (
      <>
        {loadingFallback ?? (
          <div aria-busy="true" aria-live="polite" className="space-y-2 p-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}
      </>
    );
  }

  let allowed = true;
  if (permission) allowed = hasPermission(permission);
  else if (anyPermissions) allowed = hasAnyPermission(anyPermissions);
  else if (allPermissions) allowed = hasAllPermissions(allPermissions);
  else allowed = false; // no criteria -> deny (fail closed)

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
