import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Customers"
      description="Customer list, profile, orders and activity. Backend Customer CRUD is not available yet."
      route="/customers"
      shell="Tenant"
      backendNote="BACKEND DEPENDENCY — Customer CRUD not available (model exists, no routes). UI is navigation structure only."
      nextSteps={[{ label: "Orders", href: "/orders" }]}
    />
  );
}

