"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/states";
import { notificationsApi, type NotificationPreference } from "@/lib/api/modules/notifications";
import { usePermission } from "@/lib/auth/permission-context";
import { toastError } from "@/lib/api-errors";

const CHANNELS = [
  { channel: "IN_APP", label: "In-app", description: "The bell in the top bar and the Notifications page.", icon: Bell },
  { channel: "EMAIL", label: "Email", description: "Order updates and alerts sent to your inbox.", icon: Mail },
  { channel: "SMS", label: "SMS", description: "Urgent alerts by text message.", icon: MessageSquare },
  { channel: "PUSH", label: "Push", description: "Mobile and desktop push notifications.", icon: Smartphone },
] as const;

export default function NotificationPreferencesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const prefs = useQuery({ queryKey: ["notification-preferences"], queryFn: () => notificationsApi.getPreferences() });
  const enabled = new Map((prefs.data ?? []).map((p) => [p.channel, p.isEnabled]));

  const update = useMutation({
    mutationFn: (change: { channel: string; isEnabled: boolean }) => notificationsApi.updatePreferences({ preferences: [change] }),
    onMutate: async (change) => {
      await queryClient.cancelQueries({ queryKey: ["notification-preferences"] });
      const previous = queryClient.getQueryData<NotificationPreference[]>(["notification-preferences"]);
      queryClient.setQueryData<NotificationPreference[]>(["notification-preferences"], (old) => old?.map((p) => (p.channel === change.channel ? { ...p, isEnabled: change.isEnabled } : p)));
      return { previous };
    },
    onError: (e, _, ctx) => {
      queryClient.setQueryData(["notification-preferences"], ctx?.previous);
      toastError(e, "Couldn't save preference");
    },
    onSuccess: (_, change) => toast.success(`${CHANNELS.find((c) => c.channel === change.channel)?.label} notifications ${change.isEnabled ? "on" : "off"}`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notification-preferences"] }),
  });

  return (
    <PageBody className="mx-auto w-full max-w-3xl">
      <PageHeader title="Notification preferences" description="Choose where PulseOps reaches you." />
      <Card className="gap-0 pb-0">
        <CardHeader className="border-b pb-4">
          <CardTitle>Channels</CardTitle>
          <CardDescription>Changes save automatically.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {prefs.error ? (
            <ErrorState error={prefs.error} onRetry={() => prefs.refetch()} />
          ) : (
            <ul className="divide-y">
              {CHANNELS.map(({ channel, label, description, icon: Icon }) => (
                <li key={channel} className="flex items-center gap-4 px-6 py-4">
                  <span className="flex size-10 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  {prefs.isLoading ? (
                    <Skeleton className="h-5 w-9 rounded-full" />
                  ) : (
                    <Switch
                      aria-label={`${label} notifications`}
                      checked={enabled.get(channel) ?? false}
                      disabled={!hasPermission("notification:update")}
                      onCheckedChange={(isEnabled) => update.mutate({ channel, isEnabled })}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageBody>
  );
}
