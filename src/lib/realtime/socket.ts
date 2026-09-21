/**
 * Realtime socket manager — F06 I
 * Contract: uses current accessToken, after successful refresh update auth and reconnect with NEW token.
 * If socket.io-client is not installed, this is a no-op (F22 will wire real transport). This module ensures
 * the frontend does NOT reconnect using an expired token and provides hooks for future F22 implementation.
 *
 * Listens to:
 *  - pulseops:token-refreshed  -> update stored token, reconnect
 *  - pulseops:socket-disconnect -> disconnect/reset on logout/forced logout
 *  - pulseops:auth-cleared -> clear auth
 */

import { tokenStore } from "@/lib/api/tokens";
import { publicEnv } from "@/config/env";

type SocketLike = {
  disconnect: () => void;
  connect: () => void;
  io?: { opts?: Record<string, unknown> };
  auth?: Record<string, unknown>;
};

let socketInstance: SocketLike | null = null;
let listenersAttached = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getSocketUrl(): string {
  return publicEnv.socketUrl;
}

/**
 * Register an existing Socket.IO instance for F06 token lifecycle management.
 * F22 will call this when it creates the real socket.
 */
export function registerSocket(socket: SocketLike): void {
  socketInstance = socket;
  attachListeners();
}

export function disconnectSocket(): void {
  if (socketInstance) {
    try {
      socketInstance.disconnect();
    } catch {
      // ignore
    }
    socketInstance = null;
  }
}

function attachListeners(): void {
  if (!isBrowser() || listenersAttached) return;
  listenersAttached = true;

  window.addEventListener("pulseops:token-refreshed", ((e: CustomEvent<{ accessToken: string }>) => {
    const newToken = e.detail?.accessToken ?? tokenStore.getAccessToken();
    if (!newToken) return;
    if (socketInstance) {
      try {
        // Update auth and reconnect with NEW token (never expired)
        if (socketInstance.auth) socketInstance.auth.token = newToken;
        if (socketInstance.io?.opts) {
          (socketInstance.io.opts as Record<string, unknown>).auth = { token: newToken };
        }
        // Reconnect pattern: disconnect then connect
        socketInstance.disconnect();
        socketInstance.connect();
      } catch {
        // ignore
      }
    }
  }) as EventListener);

  const disconnectHandler = (): void => {
    disconnectSocket();
  };
  window.addEventListener("pulseops:socket-disconnect", disconnectHandler);
  window.addEventListener("pulseops:auth-cleared", disconnectHandler);
}

/**
 * Helper for F22: create auth object from current token
 */
export function getSocketAuth(): { token: string } | null {
  const token = tokenStore.getAccessToken();
  if (!token) return null;
  return { token };
}

// Auto-attach listeners if no socket yet (so future registerSocket will already handle refresh)
if (isBrowser() && !listenersAttached) {
  attachListeners();
}
