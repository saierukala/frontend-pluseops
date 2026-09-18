import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Warehouses"
      description="Warehouse list — create, edit, active/default, location (F15)."
      route="/warehouses"
      shell="Tenant"
      
      nextSteps={[{ label: "Stock", href: "/inventory" }]}
    />
  );
}

