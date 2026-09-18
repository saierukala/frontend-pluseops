import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="My Orders"
      description="Customer orders — list and tracking entry (F30)."
      route="/account/orders"
      shell="Storefront"
      backendNote="BACKEND DEPENDENCY — customer-scoped order listing not available."
      nextSteps={[]}
    />
  );
}

