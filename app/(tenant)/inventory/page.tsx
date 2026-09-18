import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Inventory — Stock"
      description="Stock overview per SKU/warehouse — quantity, reserved, available, status (F16)."
      route="/inventory"
      shell="Tenant"
      
      nextSteps={[{ label: "Warehouses", href: "/warehouses" }, { label: "Movements", href: "/inventory/movements" }]}
    />
  );
}

