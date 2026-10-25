"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, type Column } from "@/components/app/data-table";
import { FormDialog, Field } from "@/components/app/form-dialog";
import { RowActions } from "@/components/app/row-actions";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { StatusPill } from "@/components/app/status-pill";
import { EmptyState } from "@/components/app/states";
import { platformApi, type PlatformAdmin, type PlatformRole } from "@/lib/api/modules/platform";
import { useAuth } from "@/lib/auth/auth-context";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";
import { formatRelative, fullName, humanize } from "@/lib/format";

// Same rules as the backend: 12+ characters with upper, lower, digit and symbol
const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Enter a valid email"),
  password: z
    .string()
    .min(12, "At least 12 characters")
    .regex(/[A-Z]/, "Add an upper-case letter")
    .regex(/[a-z]/, "Add a lower-case letter")
    .regex(/[0-9]/, "Add a digit")
    .regex(/[^A-Za-z0-9]/, "Add a symbol"),
  roleId: z.string(),
});
type Values = z.infer<typeof schema>;

function AddAdminDialog({ open, onOpenChange, roles }: { open: boolean; onOpenChange: (o: boolean) => void; roles: PlatformRole[] }) {
  const queryClient = useQueryClient();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { firstName: "", lastName: "", email: "", password: "", roleId: "" } });
  const roleId = useWatch({ control: form.control, name: "roleId" });
  const save = useMutation({
    mutationFn: (v: Values) => platformApi.addAdmin({ ...v, roleId: v.roleId || undefined }),
    onSuccess: (a) => {
      toast.success("Platform admin added", { description: a.email });
      queryClient.invalidateQueries({ queryKey: ["platform", "admins"] });
      queryClient.invalidateQueries({ queryKey: ["platform", "roles"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, Object.keys(schema.shape))) toastError(e, "Couldn't add the admin");
    },
  });
  const { errors } = form.formState;

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Add platform admin" description="Platform admins manage every tenant. They sign in with scope platform." submitLabel="Add admin" pending={save.isPending} onSubmit={form.handleSubmit((v) => save.mutate(v))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="pa-first" error={errors.firstName?.message}>
          <Input id="pa-first" autoFocus {...form.register("firstName")} />
        </Field>
        <Field label="Last name" htmlFor="pa-last" error={errors.lastName?.message}>
          <Input id="pa-last" {...form.register("lastName")} />
        </Field>
      </div>
      <Field label="Email" htmlFor="pa-email" error={errors.email?.message}>
        <Input id="pa-email" type="email" leftElement={<Mail className="size-4" />} {...form.register("email")} />
      </Field>
      <Field label="Temporary password" htmlFor="pa-pass" error={errors.password?.message} hint="12+ characters with upper, lower, digit and symbol. Share it securely; they can change it after signing in.">
        <Input id="pa-pass" type="password" autoComplete="new-password" {...form.register("password")} />
      </Field>
      <Field label="Role" error={errors.roleId?.message} hint="Defaults to the full platform admin role">
        <Select
          value={roleId || undefined}
          onValueChange={(v) => form.setValue("roleId", v)}
          placeholder="Default role"
          options={roles.map((r) => ({ value: r.id, label: humanize(r.name) }))}
        />
      </Field>
    </FormDialog>
  );
}

/** Platform admins and roles (GET/POST/DELETE /platform/admins, GET /platform/roles). */
export default function PlatformAdminsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const admins = useQuery({ queryKey: ["platform", "admins"], queryFn: () => platformApi.listAdmins() });
  const roles = useQuery({ queryKey: ["platform", "roles"], queryFn: () => platformApi.listRoles() });
  const [adding, setAdding] = React.useState(false);
  const [removing, setRemoving] = React.useState<PlatformAdmin | null>(null);

  const remove = useMutation({
    mutationFn: (a: PlatformAdmin) => platformApi.removeAdmin(a.id),
    onSuccess: (_r, a) => {
      toast.success("Platform access removed", { description: a.email });
      queryClient.invalidateQueries({ queryKey: ["platform", "admins"] });
      queryClient.invalidateQueries({ queryKey: ["platform", "roles"] });
    },
    onError: (e) => toastError(e, "Couldn't remove the admin"),
  });

  const columns: Column<PlatformAdmin>[] = [
    {
      key: "admin",
      header: "Admin",
      cell: (a) => (
        <div>
          <p className="font-medium">{fullName(a)} {a.id === user?.id ? <Badge variant="secondary" className="ml-1">You</Badge> : null}</p>
          <p className="text-xs text-muted-foreground">{a.email}</p>
        </div>
      ),
    },
    { key: "roles", header: "Roles", cell: (a) => <div className="flex flex-wrap gap-1">{a.roles.map((r) => <Badge key={r.id} variant="outline">{humanize(r.name)}</Badge>)}</div> },
    { key: "status", header: "Status", cell: (a) => <StatusPill status={a.status} /> },
    { key: "login", header: "Last sign-in", cell: (a) => <span className="text-muted-foreground">{a.lastLoginAt ? formatRelative(a.lastLoginAt) : "Never"}</span>, headerClassName: "hidden md:table-cell", className: "hidden md:table-cell" },
    {
      key: "actions",
      header: "",
      cell: (a) => <RowActions actions={[{ label: "Remove platform access", icon: Trash2, destructive: true, hidden: a.id === user?.id, onSelect: () => setRemoving(a) }]} />,
    },
  ];

  return (
    <PageBody>
      <PageHeader title="Platform admins" description="People who can manage every tenant. You can't remove yourself." actions={<Button onClick={() => setAdding(true)}><Plus /> Add admin</Button>} />
      <Card className="gap-0 py-0">
        <DataTable columns={columns} rows={admins.data} rowKey={(a) => a.id} loading={admins.isFetching} error={admins.error} onRetry={() => admins.refetch()} empty={<EmptyState icon={Users} title="No platform admins" />} />
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4" /> Platform roles</CardTitle>
          <CardDescription>Built-in roles and what they allow.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {roles.data?.map((r) => (
            <div key={r.id} className="flex flex-col gap-2 border-b pb-4 last:border-0 last:pb-0">
              <p className="text-sm font-medium">{humanize(r.name)} <span className="font-normal text-muted-foreground">· {r.adminCount} admin{r.adminCount === 1 ? "" : "s"}</span></p>
              {r.description ? <p className="text-xs text-muted-foreground">{r.description}</p> : null}
              <div className="flex flex-wrap gap-1">{r.permissions.map((p) => <Badge key={p} variant="outline" className="font-mono text-[11px]">{p}</Badge>)}</div>
            </div>
          ))}
        </CardContent>
      </Card>
      <AddAdminDialog open={adding} onOpenChange={setAdding} roles={roles.data ?? []} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Remove platform access?"
        description={`${removing?.email} will lose access to the platform console. Their account stays.`}
        confirmLabel="Remove access"
        destructive
        onConfirm={() => (removing ? remove.mutateAsync(removing) : undefined)}
      />
    </PageBody>
  );
}
