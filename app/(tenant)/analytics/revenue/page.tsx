import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Analytics — Revenue"
      description="Revenue trend charts — communicates information, not decoration (F23)."
      route="/analytics/revenue"
      shell="Tenant"
      
      nextSteps={[{ label: "Analytics", href: "/analytics" }]}
    />
  );
}

