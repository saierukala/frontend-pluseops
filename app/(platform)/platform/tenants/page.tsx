"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { platformApi } from "@/lib/api/modules/platform";
import type { Tenant } from "@/lib/api/types";
import { toast } from "sonner";

function StatusBadge({ status }: { status: Tenant["status"] }) {
  const m: Record<string, string> = {
    ACTIVE: "bg-emerald-500 text-white border-transparent",
    TRIAL: "bg-blue-500 text-white border-transparent",
    SUSPENDED: "bg-amber-500 text-white border-transparent",
    CANCELLED: "bg-zinc-500 text-white border-transparent",
  };
  return <Badge className={m[status] ?? ""}>{status}</Badge>;
}

export default function PlatformTenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [meta, setMeta] = React.useState<{ page:number; limit:number; total:number; totalPages:number } | null>(null);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(20);
  const [status, setStatus] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createLoading, setCreateLoading] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [createdInfo, setCreatedInfo] = React.useState<{ name:string; slug:string; status:string; adminEmail:string } | null>(null);
  const [form, setForm] = React.useState({ name:"", slug:"", plan:"free", status:"TRIAL" as Tenant["status"], adminEmail:"", adminPassword:"", adminFirstName:"", adminLastName:"" });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, unknown> = { page, limit };
      if (status !== "all") params.status = status;
      if (search) params.search = search;
      const env = await platformApi.listTenantsEnvelope(params as never);
      setTenants(env.data as unknown as Tenant[]);
      setMeta(env.meta as unknown as { page:number; limit:number; total:number; totalPages:number });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load tenants";
      setError(msg);
    } finally { setLoading(false); }
  }, [page, limit, status, search]);

  React.useEffect(()=>{
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleSearch = () => { setSearch(searchInput.trim()); setPage(1); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        status: form.status,
        plan: form.plan.trim() || "free",
        admin: { email: form.adminEmail.trim(), password: form.adminPassword, firstName: form.adminFirstName.trim(), lastName: form.adminLastName.trim() },
      };
      if (!payload.name || !payload.slug || !payload.admin.email || !payload.admin.password || !payload.admin.firstName || !payload.admin.lastName) {
        setCreateError("All fields are required");
        setCreateLoading(false);
        return;
      }
      if (!/^[a-z0-9-]+$/.test(payload.slug)) { setCreateError("Slug must be lowercase a-z, 0-9, hyphen"); setCreateLoading(false); return; }
      const res = await platformApi.createTenant(payload);
      const t = (res as unknown as { tenant: Tenant }).tenant;
      setCreatedInfo({ name: t.name, slug: t.slug, status: t.status, adminEmail: payload.admin.email });
      toast.success(`Tenant ${t.name} created`);
      setCreateOpen(false);
      setForm({ name:"", slug:"", plan:"free", status:"TRIAL", adminEmail:"", adminPassword:"", adminFirstName:"", adminLastName:"" });
      load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create tenant";
      setCreateError(msg);
    } finally { setCreateLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
          <p className="text-sm text-muted-foreground">Platform tenant management • real backend APIs • excludes __platform</p>
        </div>
        <Button onClick={()=>{ setCreateError(null); setCreatedInfo(null); setCreateOpen(true); }}>+ Create Tenant</Button>
      </div>

      {createdInfo && (
        <Alert className="border-emerald-500/30 bg-emerald-500/10">
          <AlertDescription className="text-sm">
            Tenant created successfully — {createdInfo.name} ({createdInfo.slug}) · Status {createdInfo.status} · Admin {createdInfo.adminEmail}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Search by name or slug, filter by status</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="flex gap-2">
              <Input id="search" placeholder="acme, store..." value={searchInput} onChange={(e)=>setSearchInput(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&handleSearch()} />
              <Button variant="outline" onClick={handleSearch}>Search</Button>
              {search ? <Button variant="ghost" onClick={()=>{setSearch(""); setSearchInput(""); setPage(1);}}>Clear</Button> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              options={[
                { value: "all", label: "All" },
                { value: "ACTIVE", label: "ACTIVE" },
                { value: "TRIAL", label: "TRIAL" },
                { value: "SUSPENDED", label: "SUSPENDED" },
                { value: "CANCELLED", label: "CANCELLED" },
              ]}
              value={status}
              onValueChange={(v)=>{ setStatus(v); setPage(1); }}
              placeholder="All"
            />
          </div>
          <div className="text-xs text-muted-foreground pb-2">Total: {meta?.total ?? (loading?"…":0)}</div>
        </CardContent>
      </Card>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Tenant list</CardTitle>
            <CardDescription>Columns derived from actual API response (name, slug, status, plan, created)</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>Refresh</Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : tenants.length===0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No tenants found. {search||status!=="all" ? "Try clearing filters." : "Create the first tenant."}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((t)=> {
                    const created = (t as unknown as { created_at?: string; createdAt?: string }).created_at ?? (t as unknown as { createdAt: string }).createdAt;
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="min-w-[180px]">
                          <div className="font-medium truncate">{t.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{t.id.slice(0,8)}…</div>
                        </TableCell>
                        <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{t.slug}</code></TableCell>
                        <TableCell><StatusBadge status={t.status} /></TableCell>
                        <TableCell><span className="text-sm">{(t as unknown as {plan?:string}).plan ?? "free"}</span></TableCell>
                        <TableCell><span className="text-xs text-muted-foreground">{created ? new Date(created).toLocaleDateString() : "—"}</span></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={()=>router.push(`/platform/tenants/${t.id}` as never)}>View</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t p-4 text-sm">
              <span className="text-muted-foreground">Page {meta.page} of {meta.totalPages} • {meta.total} tenants</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page>=meta.totalPages} onClick={()=>setPage(p=>p+1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DialogRoot open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Create Tenant</DialogTitle>
            <DialogDescription>Creates tenant, seeded roles/permissions, tenant admin and membership atomically. Admin password is never displayed after submission.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-6">
            {createError && <Alert variant="destructive"><AlertDescription>{createError}</AlertDescription></Alert>}
            <div className="space-y-4">
              <div className="text-sm font-semibold">Tenant Information</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="t-name">Tenant name *</Label>
                  <Input id="t-name" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} placeholder="Acme Store" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t-slug">Tenant slug *</Label>
                  <Input id="t-slug" value={form.slug} onChange={(e)=>setForm({...form, slug:e.target.value})} placeholder="acme-store" required />
                  <p className="text-xs text-muted-foreground">Lowercase, a-z 0-9 hyphen, 1-100. Must be unique.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t-status">Status</Label>
                  <Select
                    id="t-status"
                    options={[
                      { value: "ACTIVE", label: "ACTIVE" },
                      { value: "TRIAL", label: "TRIAL" },
                      { value: "SUSPENDED", label: "SUSPENDED" },
                    ]}
                    value={form.status}
                    onValueChange={(v)=>setForm({...form, status: v as Tenant["status"]})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t-plan">Plan</Label>
                  <Input id="t-plan" value={form.plan} onChange={(e)=>setForm({...form, plan:e.target.value})} placeholder="free" />
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="text-sm font-semibold">Initial Tenant Administrator</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="a-first">First name *</Label>
                  <Input id="a-first" value={form.adminFirstName} onChange={(e)=>setForm({...form, adminFirstName:e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="a-last">Last name *</Label>
                  <Input id="a-last" value={form.adminLastName} onChange={(e)=>setForm({...form, adminLastName:e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-email">Admin email *</Label>
                <Input id="a-email" type="email" value={form.adminEmail} onChange={(e)=>setForm({...form, adminEmail:e.target.value})} placeholder="admin@acme.example.com" required />
                <p className="text-xs text-muted-foreground">Must be globally unique (409 if duplicate).</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-pass">Password *</Label>
                <Input id="a-pass" type="password" value={form.adminPassword} onChange={(e)=>setForm({...form, adminPassword:e.target.value})} placeholder="••••••••" required />
                <p className="text-xs text-muted-foreground">Min 8, upper/lower/digit/special. Stored as Argon2id, never returned.</p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={()=>setCreateOpen(false)} disabled={createLoading}>Cancel</Button>
              <Button type="submit" disabled={createLoading}>{createLoading?"Creating...":"Create tenant"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogRoot>
    </div>
  );
}
