import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Settings"
      description="Tenant settings — general, preferences, theme (F03 shell)."
      route="/settings"
      shell="Tenant"
      
      nextSteps={[{ label: "Notification prefs", href: "/settings/notifications" }]}
    />
  );
}

