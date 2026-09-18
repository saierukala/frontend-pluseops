import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Inventory Movements"
      description="Inventory movement history — adjustments, transfers, and audit trail (F16)."
      route="/inventory/movements"
      shell="Tenant"
      
      nextSteps={[{ label: "Low Stock", href: "/inventory/low-stock" }]}
    />
  );
}

