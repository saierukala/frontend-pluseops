"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Layers, Pencil, Plus, Power } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, type Column } from "@/components/app/data-table";
import { FormDialog, Field } from "@/components/app/form-dialog";
import { RowActions } from "@/components/app/row-actions";
import { StatusPill } from "@/components/app/status-pill";
import { EmptyState } from "@/components/app/states";
import { platformApi, type Plan, type PlanLimitKey, type PlanLimits } from "@/lib/api/modules/platform";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";
import { formatNumber } from "@/lib/format";
import { LIMIT_KEYS, LIMIT_LABELS, formatLimit } from "@/features/platform/plan-limits";



// Empty = unlimited (null); otherwise a whole number
const limitField = z.string().trim().regex(/^\d*$/, "Whole number, or empty for unlimited");
const schema = z.object({
  code: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{0,48}$/, "Short key like pro or enterprise"),
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(500),
  isActive: z.boolean(),
  users: limitField,
  products: limitField,
  warehouses: limitField,
  ordersPerMonth: limitField,
});
type Values = z.infer<typeof schema>;

const toForm = (p?: Plan): Values => ({
  code: p?.code ?? "",
  name: p?.name ?? "",
  description: p?.description ?? "",
  isActive: p?.isActive ?? true,
  ...(Object.fromEntries(LIMIT_KEYS.map((k) => [k, p?.limits?.[k] == null ? "" : String(p.limits[k])])) as Record<PlanLimitKey, string>),
});
const toLimits = (v: Values): PlanLimits => Object.fromEntries(LIMIT_KEYS.map((k) => [k, v[k] === "" ? null : Number(v[k])]));


function PlanDialog({ open, onOpenChange, plan }: { open: boolean; onOpenChange: (o: boolean) => void; plan?: Plan }) {
  const queryClient = useQueryClient();
  const form = useForm<Values>({ resolver: zodResolver(schema), values: toForm(plan) });
  const save = useMutation({
    mutationFn: (v: Values) => {
      const body = { name: v.name, description: v.description || null, limits: toLimits(v), isActive: v.isActive };
      return plan ? platformApi.updatePlan(plan.code, body) : platformApi.createPlan({ code: v.code, ...body });
    },
    onSuccess: (p) => {
      toast.success(plan ? "Plan updated" : "Plan created", { description: p.name });
      queryClient.invalidateQueries({ queryKey: ["platform", "plans"] });
      onOpenChange(false);
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, Object.keys(schema.shape))) toastError(e, "Couldn't save the plan");
    },
  });
  const { errors } = form.formState;

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={plan ? `Edit ${plan.name}` : "New plan"} description="Limits apply when a tenant on this plan creates users, products, warehouses or orders." submitLabel={plan ? "Save changes" : "Create plan"} pending={save.isPending} onSubmit={form.handleSubmit((v) => save.mutate(v))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Code" htmlFor="pl-code" error={errors.code?.message} hint={plan ? "Can't change after creation" : "Used to assign the plan"}>
          <Input id="pl-code" disabled={!!plan} placeholder="pro" {...form.register("code")} />
        </Field>
        <Field label="Name" htmlFor="pl-name" error={errors.name?.message}>
          <Input id="pl-name" placeholder="Pro" {...form.register("name")} />
        </Field>
      </div>
      <Field label="Description" htmlFor="pl-desc" error={errors.description?.message}>
        <Textarea id="pl-desc" rows={2} placeholder="Optional" {...form.register("description")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        {LIMIT_KEYS.map((k) => (
          <Field key={k} label={LIMIT_LABELS[k]} htmlFor={`pl-${k}`} error={errors[k]?.message} hint="Empty = unlimited">
            <Input id={`pl-${k}`} inputMode="numeric" placeholder="Unlimited" {...form.register(k)} />
          </Field>
        ))}
      </div>
      <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
        <span>
          <span className="font-medium">Available for new assignments</span>
          <span className="block text-xs text-muted-foreground">Tenants already on an inactive plan keep it.</span>
        </span>
        <Switch checked={form.watch("isActive")} onCheckedChange={(c) => form.setValue("isActive", c, { shouldDirty: true })} />
      </label>
    </FormDialog>
  );
}

/** Plans and their limits (GET/POST/PATCH /platform/plans). */
export default function PlansPage() {
  const queryClient = useQueryClient();
  const plans = useQuery({ queryKey: ["platform", "plans", "all"], queryFn: () => platformApi.listPlans({ includeInactive: true }) });
  const [dialog, setDialog] = React.useState<{ open: boolean; plan?: Plan }>({ open: false });
  const toggle = useMutation({
    mutationFn: (p: Plan) => platformApi.updatePlan(p.code, { isActive: !p.isActive }),
    onSuccess: (p) => {
      toast.success(p.isActive ? `${p.name} is available again` : `${p.name} is no longer offered`);
      queryClient.invalidateQueries({ queryKey: ["platform", "plans"] });
    },
    onError: (e) => toastError(e, "Couldn't update the plan"),
  });

  const columns: Column<Plan>[] = [
    { key: "plan", header: "Plan", cell: (p) => <div><p className="font-medium">{p.name}</p><p className="font-mono text-xs text-muted-foreground">{p.code}</p></div> },
    ...LIMIT_KEYS.map((k) => ({ key: k, header: LIMIT_LABELS[k], cell: (p: Plan) => <span className="tabular">{formatLimit(p.limits?.[k])}</span>, headerClassName: "hidden md:table-cell", className: "hidden md:table-cell" })),
    { key: "tenants", header: "Tenants", cell: (p) => <span className="tabular">{formatNumber(p.tenantCount ?? 0)}</span> },
    { key: "status", header: "Status", cell: (p) => <StatusPill status={p.isActive ? "ACTIVE" : "INACTIVE"} label={p.isActive ? "Offered" : "Retired"} /> },
    {
      key: "actions",
      header: "",
      cell: (p) => (
        <RowActions
          actions={[
            { label: "Edit", icon: Pencil, onSelect: () => setDialog({ open: true, plan: p }) },
            { label: p.isActive ? "Retire" : "Offer again", icon: Power, onSelect: () => toggle.mutate(p), destructive: p.isActive },
          ]}
        />
      ),
    },
  ];

  return (
    <PageBody>
      <PageHeader title="Plans" description="What each plan allows. Tenants hitting a limit get PLAN_LIMIT_REACHED until they move to a bigger plan." actions={<Button onClick={() => setDialog({ open: true })}><Plus /> New plan</Button>} />
      <Card className="gap-0 py-0">
        <DataTable columns={columns} rows={plans.data} rowKey={(p) => p.id} loading={plans.isFetching} error={plans.error} onRetry={() => plans.refetch()} onRowClick={(p) => setDialog({ open: true, plan: p })} empty={<EmptyState icon={Layers} title="No plans" description="Create the first plan tenants can be assigned." />} />
      </Card>
      <PlanDialog open={dialog.open} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} plan={dialog.plan} />
    </PageBody>
  );
}
