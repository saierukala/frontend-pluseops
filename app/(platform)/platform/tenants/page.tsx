import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Platform — Tenants"
      description="Tenant management — tenant table, status, plan, actions (open/edit/suspend/reactivate/delete) (F32). UI only."
      route="/platform/tenants"
      shell="Platform"
      backendNote="BACKEND DEPENDENCY — GET /tenants list not available; tenant CRUD partially supported."
      nextSteps={[]}
    />
  );
}

