/* eslint-disable react-hooks/preserve-manual-memoization */
"use client";

import * as React from "react";
import { useAuth } from "./auth-context";
import { usersApi } from "@/lib/api/modules/users";
import type { Role } from "@/lib/api/types";
import {
  hasPermission as hasPermissionPure,
  hasAnyPermission as hasAnyPure,
  hasAllPermissions as hasAllPure,
  hasRole as hasRolePure,
  hasAnyRole as hasAnyRolePure,
  hasAllRoles as hasAllRolePure,
  normalizePermission,
  unionPermissionsFromRoles,
} from "./permissions";

export interface PermissionState {
  roles: Role[];
  permissions: string[]; // normalized union
  permissionsSet: Set<string>;
  rolesSet: Set<string>;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
}

export interface PermissionContextValue extends PermissionState {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  refresh: () => Promise<void>;
  clear: () => void;
}

const PermissionContext = React.createContext<PermissionContextValue | null>(null);

export function usePermission(): PermissionContextValue {
  const ctx = React.useContext(PermissionContext);
  if (!ctx) throw new Error("usePermission must be used within PermissionProvider");
  return ctx;
}

/** Optional hook that does not throw when outside provider (for nav guards). */
export function usePermissionOptional(): PermissionContextValue | null {
  return React.useContext(PermissionContext);
}

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading, scope } = useAuth();

  const [state, setState] = React.useState<PermissionState>({
    roles: [],
    permissions: [],
    permissionsSet: new Set<string>(),
    rolesSet: new Set<string>(),
    isLoading: false,
    isReady: false,
    error: null,
  });

  // Ref to avoid concurrent duplicate fetches
  const fetchingRef = React.useRef(false);
  const lastUserIdRef = React.useRef<string | null>(null);

  const clear = React.useCallback(() => {
    fetchingRef.current = false;
    lastUserIdRef.current = null;
    setState({
      roles: [],
      permissions: [],
      permissionsSet: new Set<string>(),
      rolesSet: new Set<string>(),
      isLoading: false,
      isReady: false,
      error: null,
    });
  }, []);

  const fetchRoles = React.useCallback(
    async (userId: string) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        // Tenant scope only — platform tokens must not hit tenant RBAC endpoint
        if (scope !== "tenant") {
          setState({
            roles: [],
            permissions: [],
            permissionsSet: new Set<string>(),
            rolesSet: new Set<string>(),
            isLoading: false,
            isReady: true, // ready with empty for platform (handled separately)
            error: null,
          });
          return;
        }
        const roles = await usersApi.getRoles(userId);
        const perms = unionPermissionsFromRoles(roles as unknown as Array<{ permissions?: Array<{ name: string }> }>);
        const normalizedPerms = perms.map(normalizePermission);
        const rolesNames = roles.map((r) => normalizePermission(r.name));
        setState({
          roles,
          permissions: normalizedPerms,
          permissionsSet: new Set(normalizedPerms),
          rolesSet: new Set(rolesNames),
          isLoading: false,
          isReady: true,
          error: null,
        });
        lastUserIdRef.current = userId;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load permissions";
        // Fail closed: isReady true but empty sets -> guards deny
        setState({
          roles: [],
          permissions: [],
          permissionsSet: new Set<string>(),
          rolesSet: new Set<string>(),
          isLoading: false,
          isReady: true,
          error: message,
        });
      } finally {
        fetchingRef.current = false;
      }
    },
    [scope]
  );

  const refresh = React.useCallback(async () => {
    if (!user?.id) return;
    if (scope !== "tenant") {
      clear();
      return;
    }
    await fetchRoles(user.id);
  }, [user?.id, scope, fetchRoles, clear]);

  // Initial + auth changes
  React.useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      clear();
      return;
    }
    // Only tenant scope loads RBAC
    if (scope !== "tenant") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      // Platform: ready with empty tenant permissions (platform perms are separate)
      setState({
        roles: [],
        permissions: [],
        permissionsSet: new Set<string>(),
        rolesSet: new Set<string>(),
        isLoading: false,
        isReady: true,
        error: null,
      });
      return;
    }
    // Avoid refetch if same user already loaded and ready
    if (lastUserIdRef.current === user.id && state.isReady && !state.isLoading) return;
    fetchRoles(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user?.id, scope]);

  // Restore after refresh: listen to token-refreshed => refetch if needed
  React.useEffect(() => {
    function onRefreshed() {
      if (isAuthenticated && user?.id && scope === "tenant" && !fetchingRef.current) {
        // Only refetch if not already ready for this user
        if (lastUserIdRef.current !== user.id) fetchRoles(user.id);
      }
    }
    function onCleared() {
      clear();
    }
    if (typeof window !== "undefined") {
      window.addEventListener("pulseops:token-refreshed", onRefreshed as EventListener);
      window.addEventListener("pulseops:auth-cleared", onCleared);
      window.addEventListener("pulseops:socket-disconnect", onCleared);
      return () => {
        window.removeEventListener("pulseops:token-refreshed", onRefreshed as EventListener);
        window.removeEventListener("pulseops:auth-cleared", onCleared);
        window.removeEventListener("pulseops:socket-disconnect", onCleared);
      };
    }
    return undefined;
  }, [isAuthenticated, user?.id, scope, fetchRoles, clear]);

  const hasPermission = React.useCallback(
    (permission: string) => {
      if (!state.isReady || state.isLoading) return false; // fail closed
      return hasPermissionPure(state.permissionsSet, permission);
    },
    [state.permissionsSet, state.isReady, state.isLoading]
  );

  const hasAnyPermission = React.useCallback(
    (permissions: string[]) => {
      if (!state.isReady || state.isLoading) return false;
      return hasAnyPure(state.permissionsSet, permissions);
    },
    [state.permissionsSet, state.isReady, state.isLoading]
  );

  const hasAllPermissions = React.useCallback(
    (permissions: string[]) => {
      if (!state.isReady || state.isLoading) return false;
      return hasAllPure(state.permissionsSet, permissions);
    },
    [state.permissionsSet, state.isReady, state.isLoading]
  );

  const hasRole = React.useCallback(
    (role: string) => {
      if (!state.isReady || state.isLoading) return false;
      return hasRolePure(state.rolesSet, role);
    },
    [state.rolesSet, state.isReady, state.isLoading]
  );

  const hasAnyRole = React.useCallback(
    (roles: string[]) => {
      if (!state.isReady || state.isLoading) return false;
      return hasAnyRolePure(state.rolesSet, roles);
    },
    [state.rolesSet, state.isReady, state.isLoading]
  );

  const hasAllRoles = React.useCallback(
    (roles: string[]) => {
      if (!state.isReady || state.isLoading) return false;
      return hasAllRolePure(state.rolesSet, roles);
    },
    [state.rolesSet, state.isReady, state.isLoading]
  );

  const value: PermissionContextValue = React.useMemo(
    () => ({
      ...state,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      hasAnyRole,
      hasAllRoles,
      refresh,
      clear,
    }),
    [state, hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole, hasAllRoles, refresh, clear]
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

/** Reusable Can() helper — mirrors spec Can({ permission, role, anyPermissions... }) */
export interface CanProps {
  permission?: string;
  role?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
  anyRoles?: string[];
  allRoles?: string[];
}

export function Can(_props: CanProps): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void _props;
  // This is a hook-wrapped helper; must be called inside component
  // For non-hook usage, see useCan()
  throw new Error("Can() must be used via useCan() hook or <CanGuard>");
}

/** Hook version of Can */
export function useCan(props: CanProps): boolean {
  const perm = usePermission();
  if (props.permission) return perm.hasPermission(props.permission);
  if (props.role) return perm.hasRole(props.role);
  if (props.anyPermissions) return perm.hasAnyPermission(props.anyPermissions);
  if (props.allPermissions) return perm.hasAllPermissions(props.allPermissions);
  if (props.anyRoles) return perm.hasAnyRole(props.anyRoles);
  if (props.allRoles) return perm.hasAllRoles(props.allRoles);
  return false;
}
