import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Order Tracking"
      description="Order tracking — timeline stepper, items, totals, payment, history + realtime (F30)."
      route="/account/orders/:id"
      shell="Storefront"
      backendNote="BACKEND DEPENDENCY — customer order tracking scoped auth not available."
      nextSteps={[]}
    />
  );
}
