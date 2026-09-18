import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Platform — Subscriptions"
      description="Subscription plans and tenant subscriptions. Platform API not yet exposed."
      route="/platform/subscriptions"
      shell="Platform"
      backendNote="BACKEND DEPENDENCY — subscriptions API not available."
      nextSteps={[]}
    />
  );
}

