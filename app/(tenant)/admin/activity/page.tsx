import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Activity"
      description="Tenant activity feed — actor, action, target, timestamp (F24)."
      route="/admin/activity"
      shell="Tenant"
      
      nextSteps={[{ label: "Audit", href: "/admin/audit" }]}
    />
  );
}

