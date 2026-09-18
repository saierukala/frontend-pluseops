import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Platform Overview"
      description="Platform admin overview — active/trial/suspended tenants, users, revenue, system health (F31). UI only."
      route="/platform"
      shell="Platform"
      backendNote="BACKEND DEPENDENCY — no /platform/* REST routes exposed. UI structure only."
      nextSteps={[{ label: "Tenants", href: "/platform/tenants" }]}
    />
  );
}

