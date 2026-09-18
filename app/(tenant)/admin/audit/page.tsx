import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Audit Log"
      description="Audit table — date, user, action, resource, request ID with detail drawer (F24)."
      route="/admin/audit"
      shell="Tenant"
      
      nextSteps={[{ label: "Activity", href: "/admin/activity" }]}
    />
  );
}

