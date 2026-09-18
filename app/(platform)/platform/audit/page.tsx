import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Platform — Audit"
      description="Platform audit log — cross-tenant audit aggregation (future)."
      route="/platform/audit"
      shell="Platform"
      backendNote="BACKEND DEPENDENCY — platform audit not available."
      nextSteps={[]}
    />
  );
}

