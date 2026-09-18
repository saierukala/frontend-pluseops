import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Dashboard"
      description="Overview of your tenant workspace — KPIs, revenue, orders and activity will live here in F09."
      route="/dashboard"
      shell="Tenant"
      
      nextSteps={[{ label: "Go to Products", href: "/products" }, { label: "Go to Orders", href: "/orders" }]}
    />
  );
}

