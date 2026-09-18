import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Payments"
      description="Payment summary, status, history, confirm/refund — server-derived amounts only (F18)."
      route="/payments"
      shell="Tenant"
      
      nextSteps={[]}
    />
  );
}

