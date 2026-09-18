import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Account"
      description="Customer account dashboard — recent orders, saved info, notifications (F29)."
      route="/account"
      shell="Storefront"
      backendNote="BACKEND DEPENDENCY — customer auth not available."
      nextSteps={[{ label: "Orders", href: "/account/orders" }]}
    />
  );
}

