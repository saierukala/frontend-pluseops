import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Checkout"
      description="Checkout — customer, delivery, order summary (backend-derived totals), payment, confirmation (F28)."
      route="/checkout"
      shell="Storefront"
      backendNote="BACKEND DEPENDENCY — /checkout not available (admin orders exist partially)."
      nextSteps={[]}
    />
  );
}

