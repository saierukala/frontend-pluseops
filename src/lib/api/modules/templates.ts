/**
 * Notification templates — a tenant's wording for messages the system sends (backend Phase 31)
 * GET/POST /notification-templates, GET/PATCH/DELETE /notification-templates/:id, POST /:id/preview
 * The active template with a message's name and channel replaces the built-in text.
 */

import { apiClient } from "../client";

export type TemplateChannel = "IN_APP" | "EMAIL" | "SMS" | "PUSH";

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: TemplateChannel;
  subject: string | null;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateBody {
  name: string;
  channel: TemplateChannel;
  subject?: string | null;
  body: string;
  variables: string[];
  isActive?: boolean;
}

export interface TemplatePreview {
  subject: string | null;
  body: string;
  missingVariables: string[];
}

/** Messages the backend sends that a template can reword, with the variables each provides. */
export const KNOWN_TEMPLATES: Array<{ name: string; channel: TemplateChannel; label: string; variables: string[] }> = [
  { name: "order.created", channel: "IN_APP", label: "New order (staff notification)", variables: ["orderId", "total", "currency"] },
  { name: "auth.verify_email", channel: "EMAIL", label: "Staff: verify email", variables: ["tenantName", "firstName", "link"] },
  { name: "auth.reset_password", channel: "EMAIL", label: "Staff: reset password", variables: ["tenantName", "firstName", "link"] },
  { name: "customer.set_password", channel: "EMAIL", label: "Shopper: set or reset password", variables: ["storeName", "code", "purpose"] },
  { name: "report.scheduled_ready", channel: "EMAIL", label: "Scheduled report ready", variables: ["scheduleName", "link", "period", "rowCount"] },
];

/** {{ name }} placeholders in a text, in order of first use. */
export function placeholdersIn(text: string | null | undefined): string[] {
  const found = new Set<string>();
  for (const m of (text ?? "").matchAll(/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g)) found.add(m[1]);
  return [...found];
}

export const templatesApi = {
  listEnvelope(params?: { page?: number; limit?: number; channel?: TemplateChannel; isActive?: boolean; search?: string }) {
    const { isActive, ...rest } = params ?? {};
    return apiClient.requestEnvelope<NotificationTemplate[]>("/notification-templates", {
      params: { ...rest, ...(isActive === undefined ? {} : { isActive: String(isActive) }) } as Record<string, unknown>,
    });
  },
  create(body: TemplateBody): Promise<NotificationTemplate> {
    return apiClient.post<NotificationTemplate>("/notification-templates", body);
  },
  update(id: string, body: Partial<TemplateBody>): Promise<NotificationTemplate> {
    return apiClient.patch<NotificationTemplate>(`/notification-templates/${id}`, body);
  },
  remove(id: string): Promise<void> {
    return apiClient.del<void>(`/notification-templates/${id}`);
  },
  preview(id: string, variables: Record<string, string>): Promise<TemplatePreview> {
    return apiClient.post<TemplatePreview>(`/notification-templates/${id}/preview`, { variables });
  },
};
