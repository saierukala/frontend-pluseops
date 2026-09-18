import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Notification Preferences"
      description="Notification preferences — channels, realtime toggles (F21)."
      route="/settings/notifications"
      shell="Tenant"
      
      nextSteps={[{ label: "Settings", href: "/settings" }]}
    />
  );
}

