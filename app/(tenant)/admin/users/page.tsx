import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Administration — Users"
      description="User list, detail, edit, role assignment (F19)."
      route="/admin/users"
      shell="Tenant"
      
      nextSteps={[{ label: "Roles", href: "/admin/roles" }]}
    />
  );
}

