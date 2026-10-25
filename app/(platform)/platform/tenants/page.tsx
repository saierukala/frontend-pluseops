"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Eye, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, FilterSelect, SearchInput, TableToolbar, ALL, type Column } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { RowActions } from "@/components/app/row-actions";
import { FormDialog, Field } from "@/components/app/form-dialog";
import { EmptyState } from "@/components/app/states";
import { platformApi } from "@/lib/api/modules/platform";
import type { Tenant } from "@/lib/api/types";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDate, humanize } from "@/lib/format";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";

const STATUSES = ["ACTIVE", "TRIAL", "SUSPENDED", "CANCELLED"] as const;

export default function PlatformTenantsPage() {
  const { get, set, page } = useUrlState();
  const search = get("q");
  const status = get("status", ALL);
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);

  const query = useQuery({
    queryKey: ["platform", "tenants", { page, search, status }],
    queryFn: () => platformApi.listTenantsEnvelope({ page, limit: 20, search: search || undefined, status: status === ALL ? undefined : status } as never),
    placeholderData: keepPreviousData,
  });

  const columns: Column<Tenant>[] = [
    {
      key: "name",
      header: "Workspace",
      cell: (t) => (
        <Link href={`/platform/tenants/${t.id}` as never} className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
            <Building2 className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium hover:underline">{t.name}</span>
            <span className="block font-mono text-xs text-muted-foreground">{t.slug}</span>
          </span>
        </Link>
      ),
    },
    { key: "status", header: "Status", cell: (t) => <StatusPill status={t.status} label={humanize(t.status)} /> },
    { key: "plan", header: "Plan", cell: (t) => <span>{humanize(t.plan ?? "free")}</span>, headerClassName: "hidden sm:table-cell", className: "hidden sm:table-cell" },
    {
      key: "created",
      header: "Created",
      cell: (t) => <span className="text-muted-foreground">{formatDate(t.createdAt)}</span>,
      headerClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-12",
      cell: (t) => <RowActions actions={[{ label: "Open", icon: Eye, onSelect: () => router.push(`/platform/tenants/${t.id}` as never) }]} />,
    },
  ];

  return (
    <PageBody>
      <PageHeader
        title="Tenants"
        description="Every business on PulseOps, its plan and status. Open one to manage it or start a support session."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> Create tenant
          </Button>
        }
      />
      <Card className="gap-0 py-0">
        <TableToolbar>
          <SearchInput value={search} onChange={(q) => set({ q })} placeholder="Search by name or slug…" />
          <FilterSelect value={status} onChange={(v) => set({ status: v })} allLabel="All statuses" options={STATUSES.map((s) => ({ value: s, label: humanize(s) }))} className="sm:ml-auto sm:w-40" />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={query.data?.data}
          rowKey={(t) => t.id}
          loading={query.isFetching}
          error={query.error}
          onRetry={() => query.refetch()}
          meta={query.data?.meta}
          onPageChange={(p) => set({ page: p })}
          empty={
            <EmptyState
              icon={Building2}
              title={search || status !== ALL ? "No matching tenants" : "No tenants yet"}
              description={search || status !== ALL ? "Try clearing the filters." : "Create the first business to get started."}
            />
          }
        />
      </Card>
      <CreateTenantDialog open={creating} onOpenChange={setCreating} />
    </PageBody>
  );
}

const PASSWORD_RULES = [/.{8,}/, /[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/];

const schema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(255),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens"),
  status: z.enum(["ACTIVE", "TRIAL", "SUSPENDED"]),
  plan: z.string().min(1),
  firstName: z.string().trim().min(1, "Required").max(100),
  lastName: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().refine((p) => PASSWORD_RULES.every((r) => r.test(p)), "At least 8 characters with upper and lower case, a number and a symbol"),
});

type Values = z.infer<typeof schema>;
const EMPTY: Values = { name: "", slug: "", status: "ACTIVE", plan: "free", firstName: "", lastName: "", email: "", password: "" };

function CreateTenantDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: EMPTY });
  const { errors } = form.formState;
  const plans = useQuery({ queryKey: ["platform", "plans"], queryFn: () => platformApi.listPlans(), enabled: open, staleTime: 60_000 });
  const status = useWatch({ control: form.control, name: "status" });
  const plan = useWatch({ control: form.control, name: "plan" });

  const create = useMutation({
    mutationFn: (v: Values) =>
      platformApi.createTenant({
        name: v.name,
        slug: v.slug,
        status: v.status,
        plan: v.plan,
        admin: { email: v.email, password: v.password, firstName: v.firstName, lastName: v.lastName },
      }),
    onSuccess: ({ tenant }, v) => {
      toast.success(`${tenant.name} is ready`, { description: `${v.email} can now sign in.` });
      queryClient.invalidateQueries({ queryKey: ["platform", "tenants"] });
      form.reset(EMPTY);
      onOpenChange(false);
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, ["name", "slug", "plan", "status"])) toastError(e, "Couldn't create tenant");
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create tenant"
      description="Sets up the business with its built-in roles and a first admin who can sign in straight away."
      submitLabel="Create tenant"
      pending={create.isPending}
      onSubmit={form.handleSubmit((v) => create.mutate(v))}
      className="sm:max-w-xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name" htmlFor="t-name" error={errors.name?.message}>
          <Input id="t-name" placeholder="Acme Retail" {...form.register("name")} />
        </Field>
        <Field label="Slug" htmlFor="t-slug" error={errors.slug?.message} hint="Used to sign in and in the shop address.">
          <Input id="t-slug" placeholder="acme" className="font-mono" {...form.register("slug")} />
        </Field>
        <Field label="Status" htmlFor="t-status">
          <Select
            id="t-status"
            value={status}
            onValueChange={(v) => form.setValue("status", v as Values["status"])}
            options={(["ACTIVE", "TRIAL", "SUSPENDED"] as const).map((s) => ({ value: s, label: humanize(s) }))}
          />
        </Field>
        <Field label="Plan" htmlFor="t-plan">
          <Select
            id="t-plan"
            value={plan}
            onValueChange={(v) => form.setValue("plan", v)}
            options={(plans.data ?? [{ code: "free", name: "Free" }]).map((p) => ({ value: p.code, label: p.name }))}
          />
        </Field>
      </div>
      <div className="flex flex-col gap-4 border-t pt-4">
        <p className="text-sm font-medium">First admin</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="a-first" error={errors.firstName?.message}>
            <Input id="a-first" {...form.register("firstName")} />
          </Field>
          <Field label="Last name" htmlFor="a-last" error={errors.lastName?.message}>
            <Input id="a-last" {...form.register("lastName")} />
          </Field>
        </div>
        <Field label="Email" htmlFor="a-email" error={errors.email?.message}>
          <Input id="a-email" type="email" placeholder="owner@acme.in" {...form.register("email")} />
        </Field>
        <Field label="Password" htmlFor="a-pass" error={errors.password?.message} hint="Share it with them securely; it isn't shown again.">
          <Input id="a-pass" type="password" autoComplete="new-password" {...form.register("password")} />
        </Field>
      </div>
    </FormDialog>
  );
}
