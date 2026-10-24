"use client";

import { PageBody, PageHeader } from "@/components/app/page-header";
import { AUDIT_ACTIONS, LogViewer } from "@/features/admin/log-viewer";
import { auditApi } from "@/lib/api/modules/audit";

export default function AuditLogPage() {
  return (
    <PageBody>
      <PageHeader title="Audit log" description="A tamper-evident record of every create, update and delete in your workspace. Sensitive fields are redacted." />
      <LogViewer queryKey="audit-logs" actions={AUDIT_ACTIONS} fetchPage={(params) => auditApi.listAuditLogsEnvelope(params)} />
    </PageBody>
  );
}
