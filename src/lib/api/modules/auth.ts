/**
 * Auth feature API — F04 (no UI, only data layer)
 * Handoff §4: POST /auth/register|login|refresh|logout|forgot|reset|verify + GET /auth/me
 * All request/response shapes are taken from handoff §3 error/envelope + §4.
 * Note: F04 implements the transport only; F05 will build the pages.
 */

import { apiClient } from "../client";
import type { User } from "../types";

export interface RegisterBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantId?: string;
}

export interface LoginBody {
  email: string;
  password: string;
  scope?: "platform" | "tenant";
  tenantId?: string;
  tenantSlug?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  scope: "platform" | "tenant";
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  scope: "platform" | "tenant";
  user: User;
}

export const authApi = {
  register(body: RegisterBody): Promise<User> {
    return apiClient.post<User>("/auth/register", body);
  },

  login(body: LoginBody): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>("/auth/login", body, { skipAuthRefresh: true });
  },

  refresh(refreshToken: string): Promise<RefreshResponse> {
    return apiClient.post<RefreshResponse>("/auth/refresh", { refreshToken }, { skipAuthRefresh: true });
  },

  logout(refreshToken?: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>(
      "/auth/logout",
      refreshToken ? { refreshToken } : {},
      { skipAuthRefresh: true }
    );
  },

  forgotPassword(body: { email: string; tenantId?: string; tenantSlug?: string }): Promise<{ success: boolean; message: string; devToken?: string }> {
    return apiClient.post<{ success: boolean; message: string; devToken?: string }>(
      "/auth/forgot-password",
      body,
      { skipAuthRefresh: true }
    );
  },

  resetPassword(body: { token: string; password: string }): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>("/auth/reset-password", body, {
      skipAuthRefresh: true,
    });
  },

  verifyEmail(body: { token: string }): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>("/auth/verify-email", body, {
      skipAuthRefresh: true,
    });
  },

  me(): Promise<User> {
    return apiClient.get<User>("/auth/me");
  },
};
