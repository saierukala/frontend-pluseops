"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gauge } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { platformApi } from "@/lib/api/modules/platform";
import { toastError } from "@/lib/api-errors";
import { formatNumber, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LIMIT_KEYS, LIMIT_LABELS, formatLimit } from "./plan-limits";

/** Usage against the plan's limits (GET /platform/tenants/:id/usage) and moving the tenant to another plan. */
export function TenantPlanCard({ tenantId, onChanged }: { tenantId: string; onChanged?: () => void }) {
  const queryClient = useQueryClient();
  const usage = useQuery({ queryKey: ["platform", "tenants", tenantId, "usage"], queryFn: () => platformApi.getTenantUsage(tenantId) });
  const plans = useQuery({ queryKey: ["platform", "plans", "active"], queryFn: () => platformApi.listPlans() });
  const current = usage.data?.plan?.code ?? "";
  const [choice, setChoice] = React.useState("");
  const selected = choice || current;

  const assign = useMutation({
    mutationFn: () => platformApi.assignPlan(tenantId, selected),
    onSuccess: () => {
      toast.success("Plan changed", { description: plans.data?.find((p) => p.code === selected)?.name });
      setChoice("");
      queryClient.invalidateQueries({ queryKey: ["platform"] });
      onChanged?.();
    },
    onError: (e) => toastError(e, "Couldn't change the plan"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Gauge className="size-4" /> Plan & usage</CardTitle>
        <CardDescription>
          {usage.data ? <>On <span className="font-medium text-foreground">{usage.data.plan?.name ?? "no plan"}</span>{usage.data.lastActivityAt ? ` · last activity ${formatRelative(usage.data.lastActivityAt)}` : ""}</> : "Loading…"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {usage.isLoading ? <Skeleton className="h-28" /> : null}
        {usage.data
          ? LIMIT_KEYS.map((k) => {
              const used = usage.data.usage[k] ?? 0;
              const limit = usage.data.plan?.limits?.[k];
              const pct = limit == null ? 0 : limit === 0 ? 100 : Math.min(100, (used / limit) * 100);
              return (
                <div key={k} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span>{LIMIT_LABELS[k]}</span>
                    <span className="tabular text-muted-foreground">{formatNumber(used)} / {formatLimit(limit)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-amber-500" : "bg-primary")} style={{ width: `${limit == null ? 0 : Math.max(pct, 2)}%` }} />
                  </div>
                </div>
              );
            })
          : null}
        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
          <Select value={selected || undefined} onValueChange={setChoice} placeholder="Choose a plan" options={(plans.data ?? []).map((p) => ({ value: p.code, label: p.name }))} />
          <Button onClick={() => assign.mutate()} loading={assign.isPending} disabled={!selected || selected === current}>Change plan</Button>
        </div>
        <p className="text-xs text-muted-foreground">Only offered plans are listed. Moving to a smaller plan keeps existing data; new records over a limit are refused.</p>
      </CardContent>
    </Card>
  );
}
