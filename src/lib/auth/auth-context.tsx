/* eslint-disable react-hooks/preserve-manual-memoization */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { tokenStore } from "@/lib/api/tokens";
import { authApi } from "@/lib/api/modules/auth";
import { apiClient } from "@/lib/api/client";
import type { User, AuthScope } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";
import "@/lib/realtime/socket";

export interface AuthState {
  user: User | null;
  scope: AuthScope | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (params: { email: string; password: string; scope?: AuthScope; tenantSlug?: string; tenantId?: string }) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; tenantId?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  clearError: () => void;
  error: string | null;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Clears all auth-related client caches per F06 E/G.
 * - React Query/SWR: dispatch clear event for any registered client
 * - Socket: dispatch disconnect event
 * - Local tenant context
 */
function clearAuthCaches(): void {
  if (typeof window !== "undefined") {
    try {
      // Dispatch event for any query client listeners
      window.dispatchEvent(new CustomEvent("pulseops:auth-cleared"));
      // Clear socket auth — components listening on this will disconnect
      window.dispatchEvent(new CustomEvent("pulseops:socket-disconnect"));
      // Remove any stale query cache keys from localStorage (defensive)
      // No React Query used yet, but future-proof: clear keys containing pulseops_cache
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.includes("pulseops_cache") || k.includes("react-query"))) keys.push(k);
      }
      for (const k of keys) window.localStorage.removeItem(k);
    } catch {
      // ignore
    }
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = React.useState<AuthState>({
    user: null,
    scope: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const clearError = React.useCallback(() => setError(null), []);

  const setUser = React.useCallback((user: User | null, scopeOverride?: AuthScope | null) => {
    const derivedScope = scopeOverride ?? (user?.scope as AuthScope | undefined) ?? (tokenStore.getScope() as AuthScope | null) ?? null;
    const normalizedScope = derivedScope as AuthScope | null;
    setState({
      user,
      scope: user ? normalizedScope : null,
      isLoading: false,
      isAuthenticated: !!user,
    });
    if (user && normalizedScope) tokenStore.setScope(normalizedScope);
    if (!user) tokenStore.setScope(null);
  }, []);

  const forcedLogout = React.useCallback((redirect = "/login") => {
    tokenStore.clear();
    clearAuthCaches();
    setState({ user: null, scope: null, isLoading: false, isAuthenticated: false });
    // Use replace to prevent back navigation to authenticated page with stale token
    try {
      router.push(redirect as never);
      router.refresh();
    } catch {
      if (typeof window !== "undefined") window.location.href = redirect;
    }
  }, [router]);

  const refreshSession = React.useCallback(async (): Promise<boolean> => {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) {
      setUser(null);
      return false;
    }

    try {
      const response = await authApi.refresh(refreshToken);
      const scope = (response as unknown as { scope?: AuthScope }).scope ?? (response.user.scope as AuthScope | undefined) ?? (tokenStore.getScope() as AuthScope | null) ?? null;
      // Preserve scope — must not switch platform<->tenant
      const previousScope = tokenStore.getScope() as AuthScope | null;
      if (previousScope && scope && previousScope !== scope) {
        // Scope switching detected — force logout per F06 H
        tokenStore.clear();
        clearAuthCaches();
        setUser(null);
        return false;
      }
      tokenStore.setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        scope,
        sessionId: response.sessionId ?? null,
        user: response.user,
      });
      setUser(response.user, scope);
      // Notify socket to reconnect with new token
      if (typeof window !== "undefined") {
        try {
          window.dispatchEvent(new CustomEvent("pulseops:token-refreshed", { detail: { accessToken: response.accessToken, scope } }));
        } catch {
          // ignore
        }
      }
      return true;
    } catch (err) {
      // Distinguish forced logout codes
      const apiErr = err as ApiError;
      const code = (apiErr?.code ?? "").toUpperCase();
      const forcedCodes = new Set([
        "INVALID_REFRESH_TOKEN",
        "REFRESH_TOKEN_EXPIRED",
        "REFRESH_TOKEN_REVOKED",
        "USER_NOT_FOUND",
        "TENANT_INACTIVE",
        "PLATFORM_ACCESS_DENIED",
      ]);
      if (code && forcedCodes.has(code)) {
        forcedLogout("/login");
      } else {
        tokenStore.clear();
        clearAuthCaches();
        setUser(null);
      }
      return false;
    }
  }, [setUser, forcedLogout]);

  /**
   * F06 F: Session restoration — authoritative boot
   * If no accessToken AND no refreshToken => unauthenticated => /login
   * If accessToken exists => GET /auth/me (authoritative)
   * If /me succeeds => restore user/scope/tenantId
   * If /me returns TOKEN_EXPIRED => single-flight refresh => retry /me ONCE
   * If refresh fails => clear => /login
   * If accessToken !exists but refreshToken exists => refresh => GET /auth/me => authenticated only after validation
   */
  const initializeAuth = React.useCallback(async () => {
    const accessToken = tokenStore.getAccessToken();
    const refreshToken = tokenStore.getRefreshToken();
    const scopeBefore = tokenStore.getScope() as AuthScope | null;

    if (!accessToken && !refreshToken) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    // Case: accessToken missing but refreshToken exists => attempt refresh then me
    if (!accessToken && refreshToken) {
      try {
        const refreshed = await refreshSession();
        if (!refreshed) {
          setState((prev) => ({ ...prev, isLoading: false }));
          return;
        }
        // Platform scope cannot use /auth/me (tenant-only, returns PLATFORM_TOKEN_FORBIDDEN).
        // refreshSession already restored user/scope; no further /me needed.
        if ((tokenStore.getScope() as AuthScope | null) === "platform") {
          return;
        }
        // Tenant: validate via /me as authoritative
        const user = await authApi.me();
        const scope = (user.scope as AuthScope | undefined) ?? (tokenStore.getScope() as AuthScope | null) ?? null;
        if (scope) tokenStore.setScope(scope);
        setUser(user, scope);
        return;
      } catch {
        tokenStore.clear();
        clearAuthCaches();
        setState({ user: null, scope: null, isLoading: false, isAuthenticated: false });
        return;
      }
    }

    // Case: accessToken exists => try /me
    // Platform tokens are rejected by /auth/me (PLATFORM_TOKEN_FORBIDDEN) — handle as valid session
    if (scopeBefore === "platform") {
      const storedUser = tokenStore.getStoredUser() as User | null;
      if (storedUser && (storedUser.scope === "platform" || scopeBefore === "platform")) {
        // Optimistically restore from stored user; token validity will be confirmed by next platform API call (with refresh fallback)
        // But still attempt /me to detect expired token vs valid token; expired will be 401 TOKEN_EXPIRED and handled via refresh
        // If /me returns PLATFORM_TOKEN_FORBIDDEN, we already know session is valid platform, so keep authenticated
      }
    }
    try {
      const user = await authApi.me();
      // Backend-derived tenantId/scope is authoritative — never trust client-provided tenantId
      const scope = (user.scope as AuthScope | undefined) ?? (tokenStore.getScope() as AuthScope | null) ?? null;
      if (scope) tokenStore.setScope(scope);
      // Store user for resilience but authoritative is /me response
      if (typeof window !== "undefined") {
        try {
          // Update stored user via tokenStore
          const currentAccess = tokenStore.getAccessToken();
          const currentRefresh = tokenStore.getRefreshToken();
          if (currentAccess && currentRefresh) {
            tokenStore.setTokens({
              accessToken: currentAccess,
              refreshToken: currentRefresh,
              scope,
              sessionId: tokenStore.getSessionId(),
              user,
            });
          }
        } catch {
          // ignore
        }
      }
      setUser(user, scope);
      return;
    } catch (err) {
      const apiErr = err as ApiError;
      const code = (apiErr?.code ?? "").toUpperCase();
      const status = apiErr?.status ?? 0;

      // Platform scope: /auth/me rejects platform tokens with 403 PLATFORM_TOKEN_FORBIDDEN.
      // This is NOT a logout — it means the token is valid platform. Restore from stored user.
      if (code === "PLATFORM_TOKEN_FORBIDDEN" && scopeBefore === "platform") {
        const storedUser = tokenStore.getStoredUser() as User | null;
        if (storedUser && (storedUser as User).id) {
          // Ensure scope remains platform
          tokenStore.setScope("platform");
          setUser(storedUser as User, "platform");
          return;
        }
        // No stored user but valid platform token: try refresh to obtain user, else keep platform scope if possible
        if (refreshToken) {
          const refreshed = await refreshSession();
          if (refreshed) return;
        }
        // If we cannot restore, fall through to unauthenticated but do not clear tokens blindly
        setState((prev) => ({ ...prev, isLoading: false, isAuthenticated: false, user: null, scope: null }));
        return;
      }

      // Forced logout codes — immediate clear
      if (code === "USER_NOT_FOUND" || code === "TENANT_INACTIVE" || code === "PLATFORM_ACCESS_DENIED") {
        tokenStore.clear();
        clearAuthCaches();
        setState({ user: null, scope: null, isLoading: false, isAuthenticated: false });
        return;
      }

      // TOKEN_EXPIRED / INVALID_TOKEN should attempt refresh once then retry /me
      if (status === 401 && (code === "TOKEN_EXPIRED" || code === "INVALID_TOKEN" || code === "INVALID_TOKEN_CLAIMS" || code === "UNAUTHORIZED" || !code)) {
        if (!refreshToken) {
          tokenStore.clear();
          clearAuthCaches();
          setState({ user: null, scope: null, isLoading: false, isAuthenticated: false });
          return;
        }
        const refreshed = await refreshSession();
        if (!refreshed) {
          setState((prev) => ({ ...prev, isLoading: false }));
          return;
        }
        // After refresh, platform scope does not need /me retry (would again be PLATFORM_TOKEN_FORBIDDEN)
        if ((tokenStore.getScope() as AuthScope | null) === "platform") {
          return;
        }
        // Retry /me ONCE after successful refresh (tenant)
        try {
          const user = await authApi.me();
          const scope = (user.scope as AuthScope | undefined) ?? (tokenStore.getScope() as AuthScope | null) ?? null;
          if (scope) tokenStore.setScope(scope);
          setUser(user, scope);
          return;
        } catch (retryErr) {
          const retryCode = ((retryErr as ApiError)?.code ?? "").toUpperCase();
          const retryStatus = (retryErr as ApiError)?.status ?? 0;
          // Platform retry will be PLATFORM_TOKEN_FORBIDDEN — keep authenticated
          if (retryCode === "PLATFORM_TOKEN_FORBIDDEN" && (tokenStore.getScope() as AuthScope | null) === "platform") {
            return;
          }
          if (retryCode === "USER_NOT_FOUND" || retryCode === "TENANT_INACTIVE" || retryCode === "PLATFORM_ACCESS_DENIED") {
            tokenStore.clear();
            clearAuthCaches();
          } else if (retryStatus === 401 || retryStatus === 403) {
            // Other auth failures after refresh -> unauthenticated
          }
          setState({ user: null, scope: null, isLoading: false, isAuthenticated: false });
          return;
        }
      }

      // Other errors (network etc.) — keep loading false but don't clear refresh token blindly
      // For 401 that wasn't refresh-eligible, still clear
      if (status === 401 || status === 403) {
        // Check forced logout again
        if (code && ["INVALID_REFRESH_TOKEN", "REFRESH_TOKEN_EXPIRED", "REFRESH_TOKEN_REVOKED"].includes(code)) {
          tokenStore.clear();
          clearAuthCaches();
        }
        setState({ user: null, scope: null, isLoading: false, isAuthenticated: false });
        return;
      }

      // Network/unknown — mark not authenticated but keep tokens for retry
      setState((prev) => ({ ...prev, isLoading: false, isAuthenticated: false, user: null, scope: null }));
    }
  }, [refreshSession, setUser]);

  // Wire central apiClient forced-logout -> AuthContext state + redirect (F06 E)
  React.useEffect(() => {
    const handleAuthFailure = (err: ApiError): void => {
      // Ensure local state reflects cleared tokens
      clearAuthCaches();
      setState({ user: null, scope: null, isLoading: false, isAuthenticated: false });
      // Dispatch cleared event for socket/query listeners
      if (typeof window !== "undefined") {
        try {
          window.dispatchEvent(new CustomEvent("pulseops:auth-cleared"));
        } catch {
          // ignore
        }
      }
      // Redirect to login — respect current location for safe redirect param
      try {
        const current = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/login";
        const target = current && current !== "/login" ? `/login?redirect=${encodeURIComponent(current)}` : "/login";
        router.push(target as never);
        router.refresh();
      } catch {
        if (typeof window !== "undefined") {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/login";
        }
      }
      // Optionally surface error via console for debugging (without token leakage)
      if (process.env.NODE_ENV === "development") {
        console.warn(`[PulseOps] Forced logout: ${err.code} ${err.status}`);
      }
    };
    apiClient.setAuthFailureHandler(handleAuthFailure);

    const clearedHandler = (): void => {
      if (!tokenStore.getAccessToken() && !tokenStore.getRefreshToken()) {
        setState((prev) => (prev.isAuthenticated ? { user: null, scope: null, isLoading: false, isAuthenticated: false } : prev));
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("pulseops:auth-cleared", clearedHandler);
      return () => {
        window.removeEventListener("pulseops:auth-cleared", clearedHandler);
        // Do not clear handler on unmount entirely — keep for app lifetime
      };
    }
    return undefined;
  }, [router]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initializeAuth();
  }, [initializeAuth]);

  const login = React.useCallback(
    async (params: { email: string; password: string; scope?: AuthScope; tenantSlug?: string; tenantId?: string }) => {
      setError(null);
      try {
        const { email, password, scope, tenantSlug, tenantId } = params;
        const body: Record<string, unknown> = { email, password };
        if (scope) body.scope = scope;
        if (tenantSlug) body.tenantSlug = tenantSlug;
        if (tenantId) body.tenantId = tenantId;
        const response = await authApi.login(body as unknown as Parameters<typeof authApi.login>[0]);
        const returnedScope = (response as unknown as { scope?: AuthScope }).scope ?? scope ?? (response.user.scope as AuthScope | undefined) ?? null;
        tokenStore.setTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          scope: returnedScope,
          sessionId: response.sessionId ?? null,
          user: response.user,
        });
        setUser(response.user, returnedScope);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed. Please check your credentials.";
        setError(message);
        throw err;
      }
    },
    [setUser],
  );

  const register = React.useCallback(async (data: { email: string; password: string; firstName: string; lastName: string; tenantId?: string }) => {
    setError(null);
    try {
      await authApi.register(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(message);
      throw err;
    }
  }, []);

  const logout = React.useCallback(async () => {
    setError(null);
    const refreshToken = tokenStore.getRefreshToken();
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      } else {
        // Still call logout with empty body per spec — backend handles empty
        await authApi.logout(undefined);
      }
    } catch {
      // Ignore logout API errors, always clear local state (F06 G)
    } finally {
      tokenStore.clear();
      clearAuthCaches();
      setUser(null);
      // Redirect to /login — prevent stale access token reuse (backend has no blocklist, frontend must block)
      try {
        router.push("/login" as never);
        router.refresh();
      } catch {
        if (typeof window !== "undefined") {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/login";
        }
      }
    }
  }, [setUser, router]);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshSession,
    clearError,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
