"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tokenStore } from "@/lib/api/tokens";
import { useAuth } from "@/lib/auth/auth-context";
import { getSocketUrl, registerSocket, disconnectSocket } from "./socket";

/** Envelope every server event arrives in (src/realtime/realtime.service.js). */
interface RealtimeEnvelope<T = Record<string, unknown>> {
  event: string;
  data: T;
  tenantId: string | null;
  timestamp: string;
}

/** Which cached lists each event makes stale. */
const INVALIDATES: Record<string, string[][]> = {
  "order.created": [["orders"], ["dashboard"], ["inventory"], ["analytics"]],
  "order.updated": [["orders"], ["order"], ["dashboard"], ["analytics"]],
  "payment.completed": [["payments"], ["order"], ["orders"], ["dashboard"], ["analytics"]],
  "inventory.low_stock": [["inventory"], ["dashboard"]],
  "notification.created": [["notifications"]],
};

/**
 * Live updates for the staff app over Socket.IO. The server joins the socket to its tenant and user rooms
 * from the token, so nothing tenant-specific is sent from here. The token-refresh / logout handling lives in
 * ./socket (registerSocket); the notification bell keeps polling as a fallback when the socket is down.
 */
export function RealtimeBridge() {
  const { isAuthenticated, scope } = useAuth();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!isAuthenticated || scope !== "tenant") return;
    const token = tokenStore.getAccessToken();
    if (!token) return;

    const socket: Socket = io(getSocketUrl(), {
      auth: { token },
      transports: ["websocket"],
      reconnectionDelayMax: 30_000,
    });
    registerSocket(socket as unknown as Parameters<typeof registerSocket>[0]);

    const onEvent = (event: string, envelope: RealtimeEnvelope) => {
      for (const key of INVALIDATES[event] ?? []) queryClient.invalidateQueries({ queryKey: key });
      if (event === "notification.created") {
        const title = typeof envelope?.data?.title === "string" ? envelope.data.title : "New notification";
        const message = typeof envelope?.data?.message === "string" ? envelope.data.message : undefined;
        toast(title, { description: message });
      }
    };
    socket.onAny(onEvent);
    // An expired token is refreshed by the API client, which emits pulseops:token-refreshed and reconnects us
    socket.on("connect_error", () => undefined);

    return () => {
      socket.offAny(onEvent);
      disconnectSocket();
      socket.disconnect();
    };
  }, [isAuthenticated, scope, queryClient]);

  return null;
}
