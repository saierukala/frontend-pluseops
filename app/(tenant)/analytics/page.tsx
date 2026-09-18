import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Analytics"
      description="Analytics overview — revenue, orders, inventory, customers with date grouping (F23)."
      route="/analytics"
      shell="Tenant"
      
      nextSteps={[{ label: "Sales", href: "/analytics/sales" }, { label: "Revenue", href: "/analytics/revenue" }]}
    />
  );
}

