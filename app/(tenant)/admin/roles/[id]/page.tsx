"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { rolesApi } from "@/lib/api/modules/roles";
import { ApiError } from "@/lib/api/errors";
import type { Role } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ForbiddenExperience } from "@/components/auth/forbidden-experience";
import { Shield, AlertTriangle } from "lucide-react";
import { formatDate, formatRelative, humanize } from "@/lib/format";

function RoleDetailContent() {
  const params = useParams<{ id: string }>();
  const id = params.id as string;
  const router = useRouter();
  const [role, setRole] = React.useState<Role | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<{ message: string; code?: string; status?: number; requestId?: string | null } | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rolesApi.getById(id);
      setRole(data);
    } catch (err) {
      const apiErr = err as ApiError;
      setError({ message: apiErr.message, code: apiErr.code, status: apiErr.status, requestId: apiErr.requestId ?? null });
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>;

  if (error) {
    if (error.status === 404) {
      return (
        <Card className="border-destructive/30">
          <CardHeader><CardTitle>Role not found</CardTitle><CardDescription>This role doesn’t exist or was deleted.</CardDescription></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button className="mt-4" variant="outline" onClick={() => router.push("/admin/roles")}>Back to roles</Button>
          </CardContent>
        </Card>
      );
    }
    if (error.status === 403) return <ForbiddenExperience description={error.message} />;
    return (
      <Card>
        <CardHeader><CardTitle>Failed to load role</CardTitle><CardDescription>{error.message} {error.code ? `(${error.code})` : ""}</CardDescription></CardHeader>
        <CardContent>
          {error.requestId ? <p className="text-xs">Request ID: {error.requestId}</p> : null}
          <Button className="mt-4" onClick={load}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!role) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/roles" className="text-muted-foreground hover:text-foreground">Roles</Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{role.name}</span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Shield className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">{role.name} {role.isSystem ? <Badge variant="secondary">Built-in</Badge> : <Badge variant="outline">Custom</Badge>}</h1>
            <p className="text-sm text-muted-foreground">{role.description ?? "No description"}</p>
          </div>
        </div>
        <Badge variant="outline">{role.userCount ?? 0} users</Badge>
      </div>

      {role.isSystem ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Built-in role</AlertTitle>
          <AlertDescription>Its name and permissions are fixed. Create a custom role if you need something different.</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Permissions ({role.permissions?.length ?? 0})</CardTitle>
          <CardDescription>What people with this role can do, grouped by area.</CardDescription>
        </CardHeader>
        <CardContent>
          {(role.permissions ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No permissions yet. Add them from the roles list.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(Object.groupBy(role.permissions!, (p) => p.resource)).map(([resource, perms]) => (
                <div key={resource} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{humanize(resource)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(perms ?? []).map((p) => (
                      <Badge key={p.id} variant="secondary" className="text-xs font-normal">
                        {humanize(p.action)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
            <div>Created {formatDate(role.createdAt)} · Updated {formatRelative(role.updatedAt)}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader><CardTitle className="text-sm">Navigation</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/roles")}>Back to roles</Button>
          <Button variant="outline" asChild><Link href="/admin/users">Go to users</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RoleDetailPage() {
  return (
    <ProtectedRoute requiredScope="tenant" requiredPermission="role:read">
      <RoleDetailContent />
    </ProtectedRoute>
  );
}
