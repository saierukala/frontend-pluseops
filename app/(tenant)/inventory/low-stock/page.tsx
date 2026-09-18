import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Low Stock"
      description="Low stock alerts — SKUs below threshold, reorder hints (F16)."
      route="/inventory/low-stock"
      shell="Tenant"
      
      nextSteps={[{ label: "Stock", href: "/inventory" }]}
    />
  );
}

