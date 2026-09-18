import { ShellPlaceholder } from "@/components/layout/placeholder";

export default function Page() {
  return (
    <ShellPlaceholder
      title="Notifications"
      description="Notification center — unread, mark read, filters, realtime (F21)."
      route="/notifications"
      shell="Tenant"
      
      nextSteps={[]}
    />
  );
}

