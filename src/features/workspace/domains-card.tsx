"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Copy, Globe, Plus, ShieldCheck, Star, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { workspaceApi, type WorkspaceDomain } from "@/lib/api/modules/tenants";
import { usePermission } from "@/lib/auth/permission-context";
import { ApiError } from "@/lib/api/errors";
import { toastError } from "@/lib/api-errors";
import { formatDate } from "@/lib/format";

function CopyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <code className="min-w-0 truncate rounded bg-muted px-2 py-1 text-xs">{value}</code>
        <Button type="button" size="icon" variant="ghost" className="size-7 shrink-0" aria-label={`Copy ${label}`} onClick={() => navigator.clipboard.writeText(value).then(() => toast.success(`${label} copied`))}>
          <Copy className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Custom domains for the storefront (GET/POST/PATCH/DELETE /workspace/domains, POST …/verify). A domain works once
 * a DNS TXT record proves ownership; the first tenant to verify a domain keeps it.
 */
export function DomainsCard() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canEdit = hasPermission("tenant:update");
  const domains = useQuery({ queryKey: ["workspace", "domains"], queryFn: () => workspaceApi.listDomains() });
  const [draft, setDraft] = React.useState("");
  const [removing, setRemoving] = React.useState<WorkspaceDomain | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["workspace"] });

  const add = useMutation({
    mutationFn: () => workspaceApi.addDomain(draft.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")),
    onSuccess: (d) => {
      toast.success("Domain added", { description: `Publish the TXT record for ${d.domain}, then verify.` });
      setDraft("");
      refresh();
    },
    onError: (e) => toastError(e, "Couldn't add the domain"),
  });
  const verify = useMutation({
    mutationFn: (d: WorkspaceDomain) => workspaceApi.verifyDomain(d.id),
    onSuccess: (d) => {
      toast.success("Domain verified", { description: d.domain });
      refresh();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === "DOMAIN_VERIFICATION_FAILED") toast.error("TXT record not found yet", { description: "DNS changes can take up to a few hours to appear. Try again later." });
      else toastError(e, "Couldn't verify the domain");
    },
  });
  const primary = useMutation({
    mutationFn: (d: WorkspaceDomain) => workspaceApi.makePrimary(d.id),
    onSuccess: (d) => {
      toast.success("Primary domain changed", { description: d.domain });
      refresh();
    },
    onError: (e) => toastError(e, "Couldn't change the primary domain"),
  });
  const remove = useMutation({
    mutationFn: (d: WorkspaceDomain) => workspaceApi.removeDomain(d.id),
    onSuccess: () => {
      toast.success("Domain removed");
      refresh();
    },
    onError: (e) => toastError(e, "Couldn't remove the domain"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Globe className="size-4" /> Custom domains</CardTitle>
        <CardDescription>Serve your storefront on your own domain. Each domain needs a DNS TXT record to prove you own it; until then it doesn&apos;t point to your store.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-6">
        {canEdit ? (
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) add.mutate(); }}>
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="shop.example.com" aria-label="Domain" />
            <Button type="submit" loading={add.isPending} disabled={!draft.trim()}><Plus /> Add</Button>
          </form>
        ) : null}
        {domains.isLoading ? <Skeleton className="h-20" /> : null}
        {domains.data?.length === 0 ? <p className="text-sm text-muted-foreground">No custom domains yet. Your store is always available at its PulseOps address.</p> : null}
        {domains.data?.map((d) => (
          <div key={d.id} className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{d.domain}</span>
              {d.primary ? <Badge><Star className="size-3" /> Primary</Badge> : null}
              {d.verified ? (
                <Badge variant="secondary" className="text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="size-3" /> Verified {d.verifiedAt ? formatDate(d.verifiedAt) : ""}</Badge>
              ) : (
                <Badge variant="outline" className="text-amber-700 dark:text-amber-400">Waiting for DNS</Badge>
              )}
              {canEdit ? (
                <div className="ml-auto flex gap-1">
                  {!d.verified ? <Button size="sm" variant="outline" loading={verify.isPending && verify.variables?.id === d.id} onClick={() => verify.mutate(d)}><ShieldCheck /> Verify</Button> : null}
                  {!d.primary ? <Button size="sm" variant="ghost" loading={primary.isPending && primary.variables?.id === d.id} onClick={() => primary.mutate(d)}>Make primary</Button> : null}
                  <Button size="icon" variant="ghost" className="size-8 text-destructive" aria-label={`Remove ${d.domain}`} onClick={() => setRemoving(d)}><Trash2 /></Button>
                </div>
              ) : null}
            </div>
            {d.verification ? (
              <div className="grid gap-3 rounded-md bg-muted/40 p-3 sm:grid-cols-[auto_1fr_1fr]">
                <CopyValue label="Type" value={d.verification.type} />
                <CopyValue label="Name" value={d.verification.name} />
                <CopyValue label="Value" value={d.verification.value} />
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Remove ${removing?.domain}?`}
        description="The storefront stops answering on this domain. You can add it again later (it needs verifying again)."
        confirmLabel="Remove domain"
        destructive
        onConfirm={() => (removing ? remove.mutateAsync(removing) : undefined)}
      />
    </Card>
  );
}
