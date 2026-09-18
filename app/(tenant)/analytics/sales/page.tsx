import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Analytics — Sales"
      description="Sales breakdown analytics — date range, group by day/week/month (F23)."
      route="/analytics/sales"
      shell="Tenant"
      
      nextSteps={[{ label: "Analytics", href: "/analytics" }]}
    />
  );
}

