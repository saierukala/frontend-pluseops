import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Platform — System"
      description="System health, status, and operational metrics (future)."
      route="/platform/system"
      shell="Platform"
      backendNote="BACKEND DEPENDENCY — system health API not available."
      nextSteps={[]}
    />
  );
}

