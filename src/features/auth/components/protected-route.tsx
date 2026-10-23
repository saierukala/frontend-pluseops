"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { usePermissionOptional } from "@/lib/auth/permission-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { ForbiddenExperience } from "@/components/auth/forbidden-experience";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requiredScope?: "platform" | "tenant";
  /** Permission-based authorization — evaluated centrally via PermissionContext */
  requiredPermission?: string;
  requiredAnyPermissions?: string[];
  requiredAllPermissions?: string[];
  requiredRole?: string;
  requiredAnyRoles?: string[];
  requiredAllRoles?: string[];
  /** Custom 403 content — defaults to ForbiddenExperience */
  forbiddenFallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  fallback,
  redirectTo = "/login",
  requiredScope,
  requiredPermission,
  requiredAnyPermissions,
  requiredAllPermissions,
  requiredRole,
  requiredAnyRoles,
  requiredAllRoles,
  forbiddenFallback,
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, scope } = useAuth();
  const permissionCtx = usePermissionOptional();
  const router = useRouter();

  const needsPermissionCheck =
    !!requiredPermission || !!requiredAnyPermissions || !!requiredAllPermissions || !!requiredRole || !!requiredAnyRoles || !!requiredAllRoles;

  // Only tenant scope uses permission/role checks — platform scope isolation preserved
  const permLoading = permissionCtx ? permissionCtx.isLoading : false;
  const permReady = permissionCtx ? permissionCtx.isReady : !needsPermissionCheck;

  React.useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      const url = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      router.push(url as never);
      router.refresh();
      return;
    }
    if (requiredScope && scope && scope !== requiredScope) {
      // Wrong scope accessing route: do NOT redirect to login when authenticated -> show forbidden
      // Keep URL but render forbidden experience; also push /forbidden for history consistency
      return;
    }
  }, [isLoading, isAuthenticated, scope, requiredScope, router, redirectTo]);

  // Loading: auth or permissions
  if (isLoading || (needsPermissionCheck && !permReady)) {
    return (
      <div suppressHydrationWarning className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <div suppressHydrationWarning className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || null;
  }

  if (requiredScope && scope && scope !== requiredScope) {
    return (
      <ForbiddenExperience
        title="Workspace mismatch"
        description={`Your session scope ${scope} cannot access this workspace. ${requiredScope === "platform" ? "Platform routes require platform authentication." : "Tenant routes require tenant authentication."}`}
        showBack={false}
      />
    );
  }

  // 403 permission/role check — authenticated but not authorized -> render Forbidden, NOT redirect to login
  if (needsPermissionCheck && permissionCtx) {
    // Fail closed when still loading
    if (permLoading || !permReady) {
      return (
        <div suppressHydrationWarning className="flex min-h-screen items-center justify-center">
          <Card className="w-full max-w-md p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
            </div>
          </Card>
        </div>
      );
    }
    let allowed = true;
    if (requiredPermission) allowed = permissionCtx.hasPermission(requiredPermission);
    else if (requiredAnyPermissions) allowed = permissionCtx.hasAnyPermission(requiredAnyPermissions);
    else if (requiredAllPermissions) allowed = permissionCtx.hasAllPermissions(requiredAllPermissions);
    else if (requiredRole) allowed = permissionCtx.hasRole(requiredRole);
    else if (requiredAnyRoles) allowed = permissionCtx.hasAnyRole(requiredAnyRoles);
    else if (requiredAllRoles) allowed = permissionCtx.hasAllRoles(requiredAllRoles);

    if (!allowed) {
      return <>{forbiddenFallback ?? <ForbiddenExperience />}</>;
    }
  } else if (needsPermissionCheck && !permissionCtx) {
    // No permission provider — fail closed
    return <>{forbiddenFallback ?? <ForbiddenExperience description="Authorization not available. Please refresh or contact your administrator." />}</>;
  }

  return <>{children}</>;
}

interface AuthGuardProps {
  children: React.ReactNode;
  redirectAuthenticatedTo?: string;
}

export function AuthGuard({ children, redirectAuthenticatedTo }: AuthGuardProps) {
  const { isLoading, isAuthenticated, scope } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Scope-aware redirect: platform → /platform, tenant → /dashboard
      let target = redirectAuthenticatedTo ?? "/dashboard";
      // If custom redirect not specified, choose by scope
      if (!redirectAuthenticatedTo || redirectAuthenticatedTo === "/dashboard") {
        if (scope === "platform") target = "/platform";
        else if (scope === "tenant") target = "/dashboard";
      }
      router.push(target as never);
      router.refresh();
    }
  }, [isLoading, isAuthenticated, scope, router, redirectAuthenticatedTo]);

  if (isLoading) {
    return (
      <div suppressHydrationWarning className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <div suppressHydrationWarning className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
