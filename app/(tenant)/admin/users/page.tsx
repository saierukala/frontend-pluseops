"use client";

import * as React from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban, CheckCircle2, ShieldCheck, Trash2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, FilterSelect, SearchInput, TableToolbar, ALL, type Column } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { RowActions } from "@/components/app/row-actions";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { FormDialog } from "@/components/app/form-dialog";
import { EmptyState } from "@/components/app/states";
import { UserAvatar } from "@/components/layout/app-sidebar";
import { usersApi } from "@/lib/api/modules/users";
import { rolesApi } from "@/lib/api/modules/roles";
import type { User } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { usePermission } from "@/lib/auth/permission-context";
import { useUrlState } from "@/hooks/use-url-state";
import { formatRelative, fullName, humanize } from "@/lib/format";
import { toastError } from "@/lib/api-errors";

export default function TeamPage() {
  const queryClient = useQueryClient();
  const { user: me } = useAuth();
  const { hasPermission } = usePermission();
  const { get, set, page } = useUrlState();
  const search = get("q");
  const status = get("status", ALL);
  const roleId = get("role", ALL);
  const [rolesFor, setRolesFor] = React.useState<User | null>(null);
  const [statusChange, setStatusChange] = React.useState<User | null>(null);
  const [deleting, setDeleting] = React.useState<User | null>(null);

  const roles = useQuery({ queryKey: ["roles", "options"], queryFn: () => rolesApi.listEnvelope({ limit: 100 }), enabled: hasPermission("role:read") });
  const query = useQuery({
    queryKey: ["users", { page, search, status, roleId }],
    queryFn: () => usersApi.listEnvelope({ page, limit: 20, search: search || undefined, status: status === ALL ? undefined : status, roleId: roleId === ALL ? undefined : roleId }),
    placeholderData: keepPreviousData,
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const toggleStatus = useMutation({
    mutationFn: (u: User) => usersApi.update(u.id, { status: u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }),
    onSuccess: (u) => {
      toast.success(u.status === "ACTIVE" ? "Access restored" : "User suspended", { description: fullName(u) });
      invalidate();
    },
    onError: (e) => toastError(e, "Couldn't change status"),
  });
  const remove = useMutation({
    mutationFn: (u: User) => usersApi.remove(u.id),
    onSuccess: (_, u) => {
      toast.success("User removed", { description: fullName(u) });
      invalidate();
    },
    onError: (e) => toastError(e, "Couldn't remove user"),
  });

  const canUpdate = hasPermission("user:update");
  const columns: Column<User>[] = [
    {
      key: "user",
      header: "Member",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <UserAvatar first={u.firstName} last={u.lastName} className="size-9 rounded-full" />
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-medium">
              {fullName(u)}
              {u.id === me?.id ? <span className="rounded bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">YOU</span> : null}
            </p>
            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "roles",
      header: "Roles",
      cell: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles?.length ? u.roles.map((r) => <StatusPill key={r.id} tone={r.name === "admin" ? "brand" : "neutral"} label={humanize(r.name)} />) : <span className="text-muted-foreground">No role</span>}
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (u) => <StatusPill status={u.status} /> },
    { key: "login", header: "Last active", cell: (u) => <span className="text-muted-foreground">{u.lastLoginAt ? formatRelative(u.lastLoginAt) : "Never"}</span>, headerClassName: "hidden md:table-cell", className: "hidden md:table-cell" },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-12",
      cell: (u) => (
        <RowActions
          actions={[
            { label: "Manage roles", icon: ShieldCheck, onSelect: () => setRolesFor(u), hidden: !canUpdate || !hasPermission("role:read") },
            { label: u.status === "ACTIVE" ? "Suspend" : "Reactivate", icon: u.status === "ACTIVE" ? Ban : CheckCircle2, onSelect: () => setStatusChange(u), hidden: !canUpdate || u.id === me?.id },
            { label: "Remove", icon: Trash2, destructive: true, onSelect: () => setDeleting(u), hidden: !hasPermission("user:delete") || u.id === me?.id },
          ]}
        />
      ),
    },
  ];

  return (
    <PageBody>
      <PageHeader
        title="Team"
        description="People with access to this workspace and what they can do."
        actions={
          hasPermission("role:read") ? (
            <Button variant="outline" asChild>
              <Link href={"/admin/roles" as never}>
                <ShieldCheck /> Roles & permissions
              </Link>
            </Button>
          ) : null
        }
      />
      <Card className="gap-0 py-0">
        <TableToolbar>
          <SearchInput value={search} onChange={(q) => set({ q })} placeholder="Search name or email…" />
          <div className="flex gap-2 sm:ml-auto">
            {roles.data ? <FilterSelect value={roleId} onChange={(v) => set({ role: v })} allLabel="All roles" options={roles.data.data.map((r) => ({ value: r.id, label: humanize(r.name) }))} className="sm:w-40" /> : null}
            <FilterSelect value={status} onChange={(v) => set({ status: v })} allLabel="All statuses" options={["ACTIVE", "INACTIVE", "SUSPENDED"].map((s) => ({ value: s, label: humanize(s) }))} className="sm:w-40" />
          </div>
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={query.data?.data}
          rowKey={(u) => u.id}
          loading={query.isFetching}
          error={query.error}
          onRetry={() => query.refetch()}
          meta={query.data?.meta}
          onPageChange={(p) => set({ page: p })}
          empty={<EmptyState icon={Users} title="No matching members" />}
        />
      </Card>

      {rolesFor ? <RolesDialog user={rolesFor} onClose={() => setRolesFor(null)} roles={roles.data?.data ?? []} /> : null}
      <ConfirmDialog
        open={Boolean(statusChange)}
        onOpenChange={(o) => !o && setStatusChange(null)}
        title={statusChange?.status === "ACTIVE" ? `Suspend ${fullName(statusChange)}?` : `Reactivate ${fullName(statusChange)}?`}
        description={statusChange?.status === "ACTIVE" ? "They're signed out everywhere and can't sign in until reactivated." : "They can sign in again with their existing roles."}
        confirmLabel={statusChange?.status === "ACTIVE" ? "Suspend" : "Reactivate"}
        destructive={statusChange?.status === "ACTIVE"}
        onConfirm={() => toggleStatus.mutateAsync(statusChange!)}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Remove ${fullName(deleting)}?`}
        description="Their account is deleted and they lose access immediately. Audit history is kept."
        confirmLabel="Remove user"
        destructive
        onConfirm={() => remove.mutateAsync(deleting!)}
      />
    </PageBody>
  );
}

function RolesDialog({ user, roles, onClose }: { user: User; roles: Array<{ id: string; name: string; description?: string | null; isSystem: boolean }>; onClose: () => void }) {
  const queryClient = useQueryClient();
  const initial = React.useMemo(() => new Set(user.roles?.map((r) => r.id) ?? []), [user]);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set(initial));

  const save = useMutation({
    mutationFn: async () => {
      const added = [...selected].filter((id) => !initial.has(id));
      const removed = [...initial].filter((id) => !selected.has(id));
      if (added.length) await usersApi.assignRoles(user.id, added);
      for (const roleId of removed) await usersApi.removeRole(user.id, roleId);
    },
    onSuccess: () => {
      toast.success("Roles updated", { description: fullName(user) });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (e) => {
      toastError(e, "Couldn't update roles");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return (
    <FormDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Roles for ${fullName(user)}`}
      description="Permissions are the union of all assigned roles. The last admin can't lose the admin role."
      submitLabel="Save roles"
      pending={save.isPending}
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div className="flex flex-col divide-y rounded-lg border">
        {roles.map((r) => (
          <div key={r.id} className="px-3 py-3">
            <Checkbox
              checked={selected.has(r.id)}
              onCheckedChange={(checked) =>
                setSelected((s) => {
                  const next = new Set(s);
                  if (checked) next.add(r.id);
                  else next.delete(r.id);
                  return next;
                })
              }
              label={humanize(r.name)}
              description={r.description ?? (r.isSystem ? "System role" : undefined)}
            />
          </div>
        ))}
      </div>
    </FormDialog>
  );
}
