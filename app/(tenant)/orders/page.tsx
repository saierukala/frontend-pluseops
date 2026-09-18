import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Orders"
      description="Order list — filters, status stepper, detail drawer (F17)."
      route="/orders"
      shell="Tenant"
      
      nextSteps={[{ label: "Create Order", href: "/orders/new" }]}
    />
  );
}

