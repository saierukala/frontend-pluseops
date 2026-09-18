import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Platform — Users"
      description="Platform users — separate from tenant users. Platform RBAC not yet mounted."
      route="/platform/users"
      shell="Platform"
      backendNote="BACKEND DEPENDENCY — platform users API not available."
      nextSteps={[]}
    />
  );
}

