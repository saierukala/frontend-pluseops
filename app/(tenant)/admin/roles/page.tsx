"use client";

import * as React from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { usePermission } from "@/lib/auth/permission-context";
import { rolesApi } from "@/lib/api/modules/roles";
import { permissionsApi } from "@/lib/api/modules/permissions";
import { usersApi } from "@/lib/api/modules/users";
import type { Role, Permission } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";
import { TENANT_PERMISSION_GROUPS } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DialogRoot, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ForbiddenExperience } from "@/components/auth/forbidden-experience";
import { Shield, Plus, Pencil, Trash2, KeyRound, AlertTriangle, Users, Lock, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";

function RoleRow({
  role,
  onUpdated,
  onDeleted,
  allPermissions,
}: {
  role: Role;
  onUpdated: () => void;
  onDeleted: () => void;
  allPermissions: Permission[];
}) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [permsOpen, setPermsOpen] = React.useState(false);
  const [name, setName] = React.useState(role.name);
  const [description, setDescription] = React.useState(role.description ?? "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isSystem = role.isSystem;

  // Permission assign — additive only
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set(role.permissions?.map((p) => p.id) ?? []));
  const [assigning, setAssigning] = React.useState(false);
  const existingIds = React.useMemo(() => new Set(role.permissions?.map((p) => p.id) ?? []), [role.permissions]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await rolesApi.update(role.id, { name: name.trim(), description: description.trim() || undefined });
      toast.success("Role updated");
      setEditOpen(false);
      onUpdated();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === "ROLE_NAME_EXISTS" || apiErr.status === 409) setError("A role with this name already exists (409).");
      else if (apiErr.code === "SYSTEM_ROLE_IMMUTABLE" || apiErr.status === 403) setError("Built-in roles can't be edited.");
      else if (apiErr.isValidation()) setError(apiErr.message || "Validation error (400).");
      else setError(apiErr.message || "Failed to update role.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    try {
      await rolesApi.remove(role.id);
      toast.success("Role deleted");
      onDeleted();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === "SYSTEM_ROLE_IMMUTABLE") toast.error("Built-in roles can't be deleted.");
      else if (apiErr.status === 404) toast.error("Role not found (404).");
      else toast.error(apiErr.message || "Delete failed");
    }
  }

  async function handleAssign() {
    // Only add new ids — backend is additive/idempotent; don't claim removal
    const toAdd = Array.from(selectedIds).filter((id) => !existingIds.has(id));
    if (toAdd.length === 0) {
      toast.info("Nothing new selected.");
      setPermsOpen(false);
      return;
    }
    setAssigning(true);
    try {
      await rolesApi.assignPermissions(role.id, toAdd);
      toast.success(`Added ${toAdd.length} permission(s) — additive & idempotent`);
      setPermsOpen(false);
      onUpdated();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === "SYSTEM_ROLE_IMMUTABLE") toast.error("Built-in role permissions can't be changed.");
      else toast.error(apiErr.message || "Failed to assign permissions");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span>{role.name}</span>
          {isSystem ? <Badge variant="secondary" className="text-[11px]">System</Badge> : <Badge variant="outline" className="text-[11px]">Custom</Badge>}
        </div>
        {role.description ? <div className="text-xs text-muted-foreground mt-1">{role.description}</div> : null}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1 max-w-[360px]">
          {(role.permissions ?? []).slice(0, 6).map((p) => (
            <Badge key={p.id} variant="outline" className="text-[11px]">{p.name}</Badge>
          ))}
          {(role.permissions?.length ?? 0) > 6 ? <Badge variant="secondary" className="text-[11px]">+{role.permissions!.length - 6} more</Badge> : null}
          {(role.permissions?.length ?? 0) === 0 ? <span className="text-xs text-muted-foreground">— no permissions</span> : null}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{role.userCount ?? 0}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <DialogRoot open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isSystem} aria-label={`Edit ${role.name}`} title={isSystem ? "Built-in roles can't be edited" : "Edit role"}>
                <Pencil className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="edit-role-desc">
              <DialogHeader>
                <DialogTitle>Edit role — {role.name}</DialogTitle>
                <DialogDescription id="edit-role-desc">Change the name or description of this role.</DialogDescription>
              </DialogHeader>
              {isSystem ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>System role</AlertTitle>
                  <AlertDescription>Built-in roles keep their name and permissions.</AlertDescription>
                </Alert>
              ) : null}
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${role.id}`}>Name</Label>
                  <Input id={`name-${role.id}`} value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} disabled={isSystem} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`desc-${role.id}`}>Description</Label>
                  <Textarea id={`desc-${role.id}`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} disabled={isSystem} />
                </div>
                {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving || isSystem}>{saving ? "Saving…" : "Save"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </DialogRoot>

          <Button variant="ghost" size="sm" disabled={isSystem} onClick={handleDelete} aria-label={`Delete ${role.name}`} title={isSystem ? "System roles cannot be deleted" : "Delete role"}>
            <Trash2 className="h-4 w-4" />
          </Button>

          <DialogRoot open={permsOpen} onOpenChange={setPermsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" disabled={isSystem} aria-label={`Manage permissions for ${role.name}`} title={isSystem ? "Built-in role permissions can't be changed" : "Add permissions"}>
                <KeyRound className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[640px]" aria-describedby="perms-desc">
              <DialogHeader>
                <DialogTitle>Add permissions — {role.name}</DialogTitle>
                <DialogDescription id="perms-desc">
                  Tick the permissions to add to this role. Permissions it already has stay as they are.
                </DialogDescription>
              </DialogHeader>
              {isSystem ? (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertTitle>Immutable role</AlertTitle>
                  <AlertDescription>Built-in role permissions can’t be changed. Create a custom role instead.</AlertDescription>
                </Alert>
              ) : null}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>How it works</AlertTitle>
                <AlertDescription>Permissions the role already has are ticked and can’t be unticked here.</AlertDescription>
              </Alert>
              <div className="space-y-6 py-2">
                {TENANT_PERMISSION_GROUPS.map((group) => (
                  <div key={group.resource}>
                    <h4 className="text-sm font-semibold">{group.label}</h4>
                    <p className="text-xs text-muted-foreground">{group.description}</p>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {allPermissions
                        .filter((p) => group.permissions.includes(p.name))
                        .map((perm) => {
                          const checked = selectedIds.has(perm.id);
                          const already = existingIds.has(perm.id);
                          return (
                            <label key={perm.id} className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${already ? "bg-muted/40 opacity-70" : "hover:bg-accent"} cursor-pointer focus-within:ring-2 focus-within:ring-ring`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={already || isSystem}
                                onChange={(e) => {
                                  setSelectedIds((prev) => {
                                    const next = new Set(prev);
                                    if (e.target.checked) next.add(perm.id);
                                    else next.delete(perm.id);
                                    return next;
                                  });
                                }}
                                className="h-4 w-4 rounded border-input"
                                aria-label={perm.name}
                              />
                              <span className="flex-1">
                                <span className="font-medium">{perm.name}</span>
                                {already ? <Badge variant="secondary" className="ml-2 text-[10px]">existing</Badge> : null}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPermsOpen(false)}>Cancel</Button>
                <Button onClick={handleAssign} disabled={assigning || isSystem}>{assigning ? "Adding…" : "Add permissions"}</Button>
              </DialogFooter>
            </DialogContent>
          </DialogRoot>

          <Button variant="ghost" size="sm" asChild aria-label={`View ${role.name}`}>
            <Link href={`/admin/roles/${role.id}` as never}>
              <Users className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function RolesPageContent() {
  const perm = usePermission();
  const canRead = perm.isReady ? perm.hasPermission("role:read") : false;
  const canCreate = perm.isReady ? perm.hasPermission("role:create") : false;

  const [roles, setRoles] = React.useState<Role[]>([]);
  const [permissions, setPermissions] = React.useState<Permission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [requestId, setRequestId] = React.useState<string | null>(null);

  // Create form
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // User role assign section
  const [userId, setUserId] = React.useState("");
  const [userRoles, setUserRoles] = React.useState<Role[]>([]);
  const [userRolesLoading, setUserRolesLoading] = React.useState(false);
  const [userRolesError, setUserRolesError] = React.useState<string | null>(null);
  const [assignRoleIds, setAssignRoleIds] = React.useState<Set<string>>(new Set());
  const [assigningRoles, setAssigningRoles] = React.useState(false);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesData, perms] = await Promise.all([rolesApi.listEnvelope({ limit: 50, page: 1 }), permissionsApi.list().catch(() => [] as Permission[])]);
      setRoles(rolesData.data);
      setRequestId(rolesData.requestId ?? null);
      setPermissions(Array.isArray(perms) ? perms : []);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to load roles");
      setRequestId(apiErr.requestId ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (perm.isReady && canRead) fetchAll();
    else if (perm.isReady && !canRead) setLoading(false);
  }, [perm.isReady, canRead, fetchAll]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await rolesApi.create({ name: newName.trim(), description: newDesc.trim() || undefined });
      toast.success("Role created");
      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
      fetchAll();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 409 || apiErr.code === "ROLE_NAME_EXISTS") setCreateError("Role name already exists (409 ROLE_NAME_EXISTS).");
      else if (apiErr.isValidation()) setCreateError(apiErr.message || "Validation error (400).");
      else setCreateError(apiErr.message || "Failed to create role");
    } finally {
      setCreating(false);
    }
  }

  async function loadUserRoles() {
    if (!userId.trim()) {
      setUserRolesError("Enter a user ID (UUID).");
      return;
    }
    setUserRolesLoading(true);
    setUserRolesError(null);
    try {
      const rolesData = await usersApi.getRoles(userId.trim());
      setUserRoles(rolesData);
      setAssignRoleIds(new Set(rolesData.map((r) => r.id)));
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 404) setUserRolesError("User not found or cross-tenant (404 USER_NOT_FOUND — tenant isolation).");
      else if (apiErr.status === 403) setUserRolesError("Forbidden — requires user:read.");
      else setUserRolesError(apiErr.message || "Failed to load user roles");
    } finally {
      setUserRolesLoading(false);
    }
  }

  async function handleAssignUserRoles() {
    if (!userId.trim()) return;
    const toAdd = Array.from(assignRoleIds).filter((id) => !userRoles.some((r) => r.id === id));
    if (toAdd.length === 0) {
      toast.info("Nothing new selected.");
      return;
    }
    setAssigningRoles(true);
    try {
      await usersApi.assignRoles(userId.trim(), toAdd);
      toast.success(`Added ${toAdd.length} role(s) — additive`);
      loadUserRoles();
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "Failed to assign roles");
    } finally {
      setAssigningRoles(false);
    }
  }

  if (!perm.isReady || perm.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!canRead) {
    return <ForbiddenExperience description="You are authenticated but lack role:read. A tenant admin must grant it via your roles." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" aria-hidden="true" /> Roles & Permissions
          </h1>
          <p className="text-sm text-muted-foreground">Decide what each person on your team can see and do.</p>
        </div>
        <DialogRoot open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canCreate} title={canCreate ? "Create a custom role" : "You don’t have permission to create roles"}>
              <Plus className="mr-2 h-4 w-4" /> Create role
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby="create-desc">
            <DialogHeader>
              <DialogTitle>Create role</DialogTitle>
              <DialogDescription id="create-desc">Use lowercase letters, numbers, - or _ (for example “warehouse_staff”).</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">Name *</Label>
                <Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., support_lead" required maxLength={100} pattern="^[a-z0-9_-]+$" />
                <p className="text-xs text-muted-foreground">Only lowercase letters, numbers, underscore and hyphen.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-desc">Description</Label>
                <Textarea id="new-desc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional — max 500 chars" maxLength={500} rows={3} />
              </div>
              {createError ? <Alert variant="destructive"><AlertDescription>{createError}</AlertDescription></Alert> : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={creating}>{creating ? "Creating…" : "Create"}</Button>
              </DialogFooter>
              </form>
          </DialogContent>
        </DialogRoot>
      </div>

      {!canCreate ? (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>Limited access</AlertTitle>
          <AlertDescription>You can view roles, but your role doesn’t allow creating new ones.</AlertDescription>
        </Alert>
      ) : null}

      {/* Roles table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">All roles <Badge variant="secondary">{roles.length}</Badge></CardTitle>
          <CardDescription>Admin, manager and member are built in. Create custom roles for anything in between.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <ErrorState title="Could not load roles" description={error} requestId={requestId ?? undefined} onRetry={fetchAll} />
          ) : roles.length === 0 ? (
            <EmptyState title="No roles yet" description="Create your first custom role by clicking Create role." actionLabel="Create role" onAction={() => setCreateOpen(true)} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((r) => (
                    <RoleRow key={r.id} role={r} onUpdated={fetchAll} onDeleted={fetchAll} allPermissions={permissions} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User role assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> User role assignment</CardTitle>
          <CardDescription>
            Give a team member more roles. Roles add up: a person can do everything any of their roles allows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1">
              <Label htmlFor="user-id">User ID (UUID)</Label>
              <Input id="user-id" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="paste user UUID from /admin/users" />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={loadUserRoles} disabled={userRolesLoading}>{userRolesLoading ? "Loading…" : "Load roles"}</Button>
            </div>
          </div>
          {userRolesError ? <Alert variant="destructive"><AlertDescription>{userRolesError}</AlertDescription></Alert> : null}
          {userRolesLoading ? <Skeleton className="h-20 w-full" /> : null}
          {!userRolesLoading && userId && userRoles.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm font-medium">Current roles for <code className="rounded bg-muted px-1">{userId.slice(0, 8)}…</code></div>
              <div className="flex flex-wrap gap-2">
                {userRoles.map((r) => (
                  <Badge key={r.id} variant="secondary" className="gap-1"><Shield className="h-3 w-3" />{r.name}</Badge>
                ))}
              </div>
            </div>
          ) : null}
          {!userRolesLoading && userId && (
            <div className="space-y-3 rounded-xl border p-4">
              <div className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Assign additional roles</div>
              <p className="text-xs text-muted-foreground">Roles the person already has are ticked. Tick more to add them.</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {roles.map((r) => {
                  const checked = assignRoleIds.has(r.id);
                  const already = userRoles.some((ur) => ur.id === r.id);
                  return (
                    <label key={r.id} className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${already ? "bg-muted/40 opacity-70" : "hover:bg-accent"} cursor-pointer focus-within:ring-2 focus-within:ring-ring`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={already}
                        onChange={(e) => {
                          setAssignRoleIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(r.id);
                            else next.delete(r.id);
                            return next;
                          });
                        }}
                        className="h-4 w-4 rounded"
                        aria-label={r.name}
                      />
                      <span className="flex-1">{r.name} {already ? <Badge variant="outline" className="ml-2 text-[10px]">existing</Badge> : null}</span>
                    </label>
                  );
                })}
              </div>
              <Button onClick={handleAssignUserRoles} disabled={assigningRoles || !perm.hasPermission("user:update")} title={perm.hasPermission("user:update") ? "" : "You don’t have permission to change team members"}>
                {assigningRoles ? "Assigning…" : "Assign selected roles"}
              </Button>
              {!perm.hasPermission("user:update") ? <p className="text-xs text-amber-600">You need permission to update team members to assign roles.</p> : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function RolesPage() {
  return (
    <ProtectedRoute requiredScope="tenant" requiredPermission="role:read">
      <RolesPageContent />
    </ProtectedRoute>
  );
}
