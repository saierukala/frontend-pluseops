"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BellRing, Cog, Eraser } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/app/status-pill";
import { jobsApi } from "@/lib/api/modules/jobs";
import { usePermission } from "@/lib/auth/permission-context";
import { humanize } from "@/lib/format";
import { toastError } from "@/lib/api-errors";

/**
 * Background-job status and manual triggers (POST /jobs/*). The jobs API only requires a signed-in user, so the
 * card is limited to workspace admins here; scheduled runs happen on their own when schedulers are enabled.
 */
export function MaintenanceCard() {
  const { hasRole } = usePermission();
  const isAdmin = hasRole("admin");
  const status = useQuery({ queryKey: ["jobs", "status"], queryFn: () => jobsApi.getStatus(), enabled: isAdmin, refetchInterval: 30_000 });

  const cleanup = useMutation({
    mutationFn: () => jobsApi.cleanup(),
    onSuccess: () => toast.success("Cleanup started", { description: "Expired tokens and stale records are being removed." }),
    onError: (e) => toastError(e, "Couldn't start cleanup"),
  });
  const testNotification = useMutation({
    mutationFn: () => jobsApi.enqueueNotification({ title: "Test notification", message: "Notifications are reaching you in real time.", channel: "IN_APP" }),
    onSuccess: () => toast.success("Test notification queued", { description: "It should appear in the bell within a few seconds." }),
    onError: (e) => toastError(e, "Couldn't queue notification"),
  });

  if (!isAdmin) return null;
  const s = status.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cog className="size-4" /> Maintenance
        </CardTitle>
        <CardDescription>Background jobs that keep the workspace tidy. Admins only.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {status.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : s ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusPill tone={s.enabled && s.workersStarted ? "success" : "warning"} label={s.enabled ? (s.workersStarted ? "Workers running" : "Workers stopped") : "Queues disabled"} />
            {typeof s.workerCount === "number" ? <span className="text-muted-foreground">{s.workerCount} workers</span> : null}
            <span className="text-muted-foreground">· {s.queues.map(humanize).join(", ")}</span>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => cleanup.mutate()} loading={cleanup.isPending}>
            <Eraser /> Run cleanup now
          </Button>
          <Button variant="outline" onClick={() => testNotification.mutate()} loading={testNotification.isPending}>
            <BellRing /> Send test notification
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
