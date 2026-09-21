/* eslint-disable react-hooks/preserve-manual-memoization */
"use client";

import * as React from "react";
import { tokenStore } from "@/lib/api/tokens";
import { authApi } from "@/lib/api/modules/auth";
import type { User, AuthScope } from "@/lib/api/types";

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

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = React.useState<AuthState>({
    user: null,
    scope: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const [error, setError] = React.useState<string | null>(null);
  const mountedRef = React.useRef(false);

  const clearError = React.useCallback(() => setError(null), []);

  const setUser = React.useCallback((user: User | null, scopeOverride?: AuthScope | null) => {
    const derivedScope = scopeOverride ?? (user?.scope as AuthScope | undefined) ?? tokenStore.getScope() as AuthScope | null ?? null;
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

  const refreshSession = React.useCallback(async (): Promise<boolean> => {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) {
      setUser(null);
      return false;
    }

    try {
      const response = await authApi.refresh(refreshToken);
      const scope = (response as unknown as { scope?: AuthScope }).scope ?? (response.user.scope as AuthScope | undefined) ?? null;
      tokenStore.setTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken, scope });
      setUser(response.user, scope);
      return true;
    } catch {
      tokenStore.clear();
      setUser(null);
      return false;
    }
  }, [setUser]);

  const initializeAuth = React.useCallback(async () => {
    const accessToken = tokenStore.getAccessToken();
    const refreshToken = tokenStore.getRefreshToken();

    if (!accessToken && !refreshToken) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const user = await authApi.me();
      const scope = (user.scope as AuthScope | undefined) ?? (tokenStore.getScope() as AuthScope | null);
      if (scope) tokenStore.setScope(scope);
      setUser(user, scope ?? null);
    } catch {
      if (refreshToken) {
        const refreshed = await refreshSession();
        if (!refreshed) {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    }
  }, [refreshSession, setUser]);

  React.useEffect(() => {
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initializeAuth();
    return () => {
      mountedRef.current = false;
    };
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
        tokenStore.setTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken, scope: returnedScope });
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
      }
    } catch {
      // Ignore logout API errors, always clear local state
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  }, [setUser]);

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
