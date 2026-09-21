"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { platformApi } from "@/lib/api/modules/platform";
import type { Tenant } from "@/lib/api/types";
import { toast } from "sonner";
import { Select } from "@/components/ui/select";

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as string;
  const router = useRouter();
  const [tenant, setTenant] = React.useState<Tenant | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusValue, setStatusValue] = React.useState<Tenant["status"] | "">("");
  const [statusSaving, setStatusSaving] = React.useState(false);
  const [adminForm, setAdminForm] = React.useState({ email: "", password: "", firstName: "", lastName: "" });
  const [adminError, setAdminError] = React.useState<string | null>(null);
  const [adminSaving, setAdminSaving] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [editData, setEditData] = React.useState({ name: "", slug: "", plan: "" });
  const [editSaving, setEditSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await platformApi.getTenant(id);
      setTenant(data);
      setStatusValue(data.status);
      setEditData({ name: data.name, slug: data.slug, plan: (data as unknown as { plan?: string }).plan ?? "free" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load tenant";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleStatus = async () => {
    if (!statusValue || !tenant) return;
    setStatusSaving(true);
    setError(null);
    try {
      const updated = await platformApi.updateTenantStatus(tenant.id, statusValue as Tenant["status"]);
      setTenant(updated);
      toast.success(`Status updated to ${statusValue}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status update failed");
    } finally { setStatusSaving(false); }
  };

  const handleEdit = async () => {
    if (!tenant) return;
    setEditSaving(true);
    setError(null);
    try {
      const body: Record<string,string> = {};
      if (editData.name.trim() && editData.name.trim() !== tenant.name) body.name = editData.name.trim();
      if (editData.slug.trim() && editData.slug.trim() !== tenant.slug) body.slug = editData.slug.trim();
      if (editData.plan.trim() && editData.plan.trim() !== (tenant as unknown as {plan?:string}).plan) body.plan = editData.plan.trim();
      if (Object.keys(body).length === 0) { setEditMode(false); setEditSaving(false); return; }
      const updated = await platformApi.updateTenant(tenant.id, body);
      setTenant(updated);
      toast.success("Tenant updated");
      setEditMode(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally { setEditSaving(false); }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminSaving(true);
    try {
      const created = await platformApi.createTenantAdmin(id, adminForm);
      // created contains real backend fields: id/email/firstName/lastName/tenantId (no password, no mocked role/status)
      toast.success(`Admin ${created.email} (${created.firstName} ${created.lastName}) created`);
      setAdminForm({ email: "", password: "", firstName: "", lastName: "" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create admin";
      setAdminError(msg);
    } finally { setAdminSaving(false); }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-60" /></div>;
  if (error && !tenant) return (
    <Card className="border-destructive/30">
      <CardHeader><CardTitle className="text-destructive">Failed to load tenant</CardTitle><CardDescription>{error}</CardDescription></CardHeader>
      <CardContent><Button variant="outline" onClick={()=>router.push("/platform/tenants")}>Back to tenants</Button></CardContent>
    </Card>
  );
  if (!tenant) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/platform/tenants" className="text-muted-foreground hover:text-foreground">Tenants</Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{tenant.name}</span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground">{tenant.slug} • {(tenant as unknown as { plan?: string }).plan ?? "free"} • {tenant.id.slice(0,8)}…</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=>load()} disabled={loading}>Refresh</Button>
          <Button variant="outline" onClick={()=>router.push("/platform/tenants")}>Back</Button>
        </div>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tenant details</CardTitle>
                <CardDescription>ID {tenant.id} • Created {new Date((tenant as unknown as { created_at?: string; createdAt?: string }).created_at ?? (tenant as unknown as { createdAt: string}).createdAt).toLocaleString()}</CardDescription>
              </div>
              <Badge variant={tenant.status==="ACTIVE"?"default":tenant.status==="TRIAL"?"secondary":"outline"}>{tenant.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!editMode ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><div className="text-xs text-muted-foreground">Name</div><div className="text-sm font-medium">{tenant.name}</div></div>
                  <div><div className="text-xs text-muted-foreground">Slug</div><div className="text-sm font-mono">{tenant.slug}</div></div>
                  <div><div className="text-xs text-muted-foreground">Plan</div><div className="text-sm">{(tenant as unknown as {plan?:string}).plan ?? "free"}</div></div>
                  <div><div className="text-xs text-muted-foreground">Status</div><div className="text-sm">{tenant.status}</div></div>
                </div>
                <Button variant="outline" size="sm" onClick={()=>setEditMode(true)}>Edit tenant</Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input id="edit-name" value={editData.name} onChange={(e)=>setEditData({...editData, name:e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-slug">Slug</Label>
                    <Input id="edit-slug" value={editData.slug} onChange={(e)=>setEditData({...editData, slug:e.target.value})} placeholder="acme-store" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-plan">Plan</Label>
                    <Input id="edit-plan" value={editData.plan} onChange={(e)=>setEditData({...editData, plan:e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleEdit} disabled={editSaving}>{editSaving?"Saving...":"Save"}</Button>
                  <Button variant="ghost" onClick={()=>setEditMode(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="text-sm font-medium mb-2">Change status</div>
              <div className="flex gap-2">
                <Select
                  options={[
                    { value: "ACTIVE", label: "ACTIVE" },
                    { value: "TRIAL", label: "TRIAL" },
                    { value: "SUSPENDED", label: "SUSPENDED" },
                    { value: "CANCELLED", label: "CANCELLED" },
                  ]}
                  value={statusValue}
                  onValueChange={(v)=>setStatusValue(v as Tenant["status"])}
                  placeholder="Select status"
                />
                <Button onClick={handleStatus} disabled={statusSaving || statusValue===tenant.status}>{statusSaving?"Updating...":"Update status"}</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Suspending a tenant blocks tenant login (403 TENANT_INACTIVE) until reactivated.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create tenant admin</CardTitle>
            <CardDescription>Creates initial admin for this tenant (platform:tenant:create).</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-3">
              {adminError && <Alert variant="destructive"><AlertDescription>{adminError}</AlertDescription></Alert>}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="adm-first">First name</Label>
                  <Input id="adm-first" value={adminForm.firstName} onChange={(e)=>setAdminForm({...adminForm, firstName:e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adm-last">Last name</Label>
                  <Input id="adm-last" value={adminForm.lastName} onChange={(e)=>setAdminForm({...adminForm, lastName:e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adm-email">Email</Label>
                <Input id="adm-email" type="email" value={adminForm.email} onChange={(e)=>setAdminForm({...adminForm, email:e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adm-pass">Password</Label>
                <Input id="adm-pass" type="password" value={adminForm.password} onChange={(e)=>setAdminForm({...adminForm, password:e.target.value})} required />
                <p className="text-xs text-muted-foreground">Min 8, upper/lower/digit/special. Never shown after submission.</p>
              </div>
              <Button type="submit" className="w-full" disabled={adminSaving}>{adminSaving?"Creating...":"Create admin"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
