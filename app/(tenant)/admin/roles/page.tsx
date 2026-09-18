import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Administration — Roles"
      description="Roles and permission matrix — read/create/update/delete per resource (F20)."
      route="/admin/roles"
      shell="Tenant"
      backendNote="PARTIALLY SUPPORTED — remove user role / remove role permission not available."
      nextSteps={[{ label: "Users", href: "/admin/users" }]}
    />
  );
}

