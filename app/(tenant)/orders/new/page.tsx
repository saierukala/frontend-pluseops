import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Create Order"
      description="Order creation — customer, items, pricing, confirmation (F17)."
      route="/orders/new"
      shell="Tenant"
      
      nextSteps={[{ label: "All Orders", href: "/orders" }]}
    />
  );
}

