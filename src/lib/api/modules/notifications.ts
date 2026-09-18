/**
 * Notifications — F04
 * Handoff §3: GET /notifications, PATCH /notifications/:id/read, POST /notifications/read-all,
 *             GET /notification-preferences, PATCH /notification-preferences
 */

import { apiClient } from "../client";
import type { QueryParams } from "../query";

export interface Notification {
  id: string;
  tenantId: string;
  userId?: string | null;
  type: string;
  title: string;
  message: string;
  channel: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  tenantId: string;
  userId: string;
  channel: string;
  isEnabled: boolean;
}

export const notificationsApi = {
  list(params?: QueryParams): Promise<Notification[]> {
    return apiClient.get<Notification[]>("/notifications", { params: params as Record<string, unknown> });
  },
  listEnvelope(params?: QueryParams) {
    return apiClient.requestEnvelope<Notification[]>("/notifications", {
      params: params as Record<string, unknown>,
    });
  },
  markRead(id: string): Promise<Notification> {
    return apiClient.patch<Notification>(`/notifications/${id}/read`, {});
  },
  markAllRead(): Promise<unknown> {
    return apiClient.post<unknown>("/notifications/read-all", {});
  },
  getPreferences(): Promise<NotificationPreference[]> {
    return apiClient.get<NotificationPreference[]>("/notification-preferences");
  },
  updatePreferences(body: { preferences: Array<{ channel: string; isEnabled: boolean }> }): Promise<NotificationPreference[]> {
    return apiClient.patch<NotificationPreference[]>("/notification-preferences", body);
  },
};
