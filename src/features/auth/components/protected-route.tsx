"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requiredScope?: "platform" | "tenant";
}

export function ProtectedRoute({
  children,
  fallback,
  redirectTo = "/login",
  requiredScope,
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, scope } = useAuth();
  const router = useRouter();

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
      // Wrong scope accessing route: tenant→platform or platform→tenant
      router.push("/forbidden" as never);
      router.refresh();
    }
  }, [isLoading, isAuthenticated, scope, requiredScope, router, redirectTo]);

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

  if (!isAuthenticated) {
    return fallback || null;
  }

  if (requiredScope && scope && scope !== requiredScope) {
    return (
      <div suppressHydrationWarning className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md p-6 text-center">
          <h1 className="text-lg font-semibold">Access forbidden</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your session scope <code className="rounded bg-muted px-1">{scope}</code> cannot access this workspace.
            {requiredScope === "platform" ? " Platform routes require platform authentication." : " Tenant routes require tenant authentication."}
          </p>
        </Card>
      </div>
    );
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
