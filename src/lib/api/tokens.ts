/**
 * Token store abstraction — F04
 * F04 does NOT implement authentication UI (F05). This module only provides
 * the storage contract the central client uses to attach Authorization headers
 * and to perform refresh handling. F05 will own login/logout UX.
 *
 * Storage: memory + localStorage (browser) fallback. No secrets are persisted
 * beyond the tokens returned by the backend (access 15m, refresh 7d).
 * Tokens are never logged or added to URLs.
 */

const ACCESS_KEY = "pulseops_access_token";
const REFRESH_KEY = "pulseops_refresh_token";

let memoryAccess: string | null = null;
let memoryRefresh: string | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export interface TokenStore {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(tokens: { accessToken: string; refreshToken: string }): void;
  setAccessToken(token: string): void;
  clear(): void;
}

export const tokenStore: TokenStore = {
  getAccessToken(): string | null {
    if (memoryAccess) return memoryAccess;
    if (isBrowser()) {
      try {
        return window.localStorage.getItem(ACCESS_KEY);
      } catch {
        return null;
      }
    }
    return null;
  },

  getRefreshToken(): string | null {
    if (memoryRefresh) return memoryRefresh;
    if (isBrowser()) {
      try {
        return window.localStorage.getItem(REFRESH_KEY);
      } catch {
        return null;
      }
    }
    return null;
  },

  setTokens({ accessToken, refreshToken }): void {
    memoryAccess = accessToken;
    memoryRefresh = refreshToken;
    if (isBrowser()) {
      try {
        window.localStorage.setItem(ACCESS_KEY, accessToken);
        window.localStorage.setItem(REFRESH_KEY, refreshToken);
      } catch {
        // quota / private mode — keep in memory only
      }
    }
  },

  setAccessToken(token: string): void {
    memoryAccess = token;
    if (isBrowser()) {
      try {
        window.localStorage.setItem(ACCESS_KEY, token);
      } catch {
        // ignore
      }
    }
  },

  clear(): void {
    memoryAccess = null;
    memoryRefresh = null;
    if (isBrowser()) {
      try {
        window.localStorage.removeItem(ACCESS_KEY);
        window.localStorage.removeItem(REFRESH_KEY);
      } catch {
        // ignore
      }
    }
  },
};
