"use client";

import { PageBody, PageHeader } from "@/components/app/page-header";
import { LogViewer } from "@/features/admin/log-viewer";
import { auditApi } from "@/lib/api/modules/audit";

export default function ActivityLogPage() {
  return (
    <PageBody>
      <PageHeader title="Activity" description="Sign-ins and user activity across your team." />
      <LogViewer
        queryKey="activity-logs"
        fetchPage={(params) => auditApi.listActivityLogsEnvelope(params)}
      />
    </PageBody>
  );
}
