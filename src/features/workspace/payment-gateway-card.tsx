"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, CreditCard, KeyRound, Unplug } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field } from "@/components/app/form-dialog";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { workspaceApi } from "@/lib/api/modules/tenants";
import { publicEnv } from "@/config/env";
import { usePermission } from "@/lib/auth/permission-context";
import { ApiError } from "@/lib/api/errors";
import { toastError } from "@/lib/api-errors";
import { formatRelative } from "@/lib/format";

const KEY_ID = /^rzp_(test|live)_[A-Za-z0-9]{6,}$/;

/**
 * The shop's own Razorpay account (Phase 35). Money from storefront checkouts goes straight to it. Secrets are sent
 * once and never shown again; the API only says whether they are set.
 */
export function PaymentGatewayCard() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canEdit = hasPermission("tenant:update");
  const gateway = useQuery({ queryKey: ["workspace", "payment-gateway"], queryFn: () => workspaceApi.getPaymentGateway() });
  const [editing, setEditing] = React.useState(false);
  const [keyId, setKeyId] = React.useState("");
  const [keySecret, setKeySecret] = React.useState("");
  const [webhookSecret, setWebhookSecret] = React.useState("");
  const [problem, setProblem] = React.useState<string | null>(null);
  const [disconnecting, setDisconnecting] = React.useState(false);
  const g = gateway.data;
  const webhookUrl = g ? `${publicEnv.apiUrl}${g.webhookUrlPath}` : "";
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["workspace", "payment-gateway"] });

  const save = useMutation({
    mutationFn: () => workspaceApi.savePaymentGateway({ keyId: keyId.trim(), keySecret: keySecret.trim(), webhookSecret: webhookSecret || undefined }),
    onSuccess: (saved) => {
      toast.success("Razorpay connected", { description: `${saved.mode === "live" ? "Live" : "Test"} keys · checkout is on` });
      setEditing(false);
      setKeySecret("");
      setWebhookSecret("");
      setProblem(null);
      queryClient.setQueryData(["workspace", "payment-gateway"], saved);
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === "RAZORPAY_KEYS_INVALID") setProblem("Razorpay rejected these keys. Copy the key id and secret again from Razorpay Dashboard → Account & Settings → API Keys.");
      else if (e instanceof ApiError && e.code === "CREDENTIALS_ENCRYPTION_NOT_CONFIGURED") setProblem("The server isn't set up to store payment keys yet (CREDENTIALS_ENCRYPTION_KEY). Ask your PulseOps administrator.");
      else if (e instanceof ApiError && e.status === 502) setProblem("Razorpay couldn't be reached to check the keys. Try again in a minute.");
      else toastError(e, "Couldn't connect Razorpay");
    },
  });
  const toggle = useMutation({
    mutationFn: (enabled: boolean) => workspaceApi.setPaymentGatewayEnabled(enabled),
    onSuccess: (saved) => {
      toast.success(saved.enabled ? "Online payment is on" : "Online payment is off", { description: saved.enabled ? undefined : "New checkouts get a pending payment you settle by hand." });
      queryClient.setQueryData(["workspace", "payment-gateway"], saved);
    },
    onError: (e) => toastError(e, "Couldn't update online payment"),
  });
  const remove = useMutation({
    mutationFn: () => workspaceApi.removePaymentGateway(),
    onSuccess: () => {
      toast.success("Razorpay disconnected");
      refresh();
    },
    onError: (e) => toastError(e, "Couldn't disconnect Razorpay"),
  });

  const keyIdError = keyId && !KEY_ID.test(keyId.trim()) ? "Starts with rzp_test_ or rzp_live_" : undefined;
  const showForm = canEdit && (editing || (g && !g.configured));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="size-4" /> Online payment (Razorpay)
          {g?.configured ? <Badge variant={g.mode === "live" ? "default" : "secondary"}>{g.mode === "live" ? "Live" : "Test mode"}</Badge> : null}
        </CardTitle>
        <CardDescription>Shoppers pay at checkout with your own Razorpay account, so money goes straight to you. Without it, orders get a pending payment you settle by hand.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-6">
        {gateway.isLoading ? <Skeleton className="h-24" /> : null}
        {g?.configured && !editing ? (
          <>
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Key id</dt>
                <dd className="mt-1 font-mono">{g.keyId}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Webhook secret</dt>
                <dd className="mt-1">{g.webhookSecretSet ? "Set" : <span className="text-amber-600">Not set</span>}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Updated</dt>
                <dd className="mt-1">{g.updatedAt ? formatRelative(g.updatedAt) : "—"}</dd>
              </div>
            </dl>
            <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
              <span>
                <span className="font-medium">Take payments online</span>
                <span className="block text-xs text-muted-foreground">Turning it off keeps the keys; refunds of earlier online payments still work.</span>
              </span>
              <Switch checked={g.enabled} disabled={!canEdit || toggle.isPending} onCheckedChange={(c) => toggle.mutate(c)} />
            </label>
          </>
        ) : null}
        {g ? (
          <Field label="Webhook URL" hint="In Razorpay Dashboard → Webhooks, add this URL with the events payment.captured and order.paid, and the same secret as below. It confirms payments even when the shopper closes the window early.">
            <div className="flex gap-2">
              <Input readOnly value={webhookUrl} className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" aria-label="Copy webhook URL" onClick={() => navigator.clipboard.writeText(webhookUrl).then(() => toast.success("Webhook URL copied"))}>
                <Copy />
              </Button>
            </div>
          </Field>
        ) : null}
        {showForm ? (
          <form
            id="rzp-form"
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!keyIdError && keyId && keySecret) save.mutate();
            }}
          >
            {problem ? (
              <Alert variant="destructive">
                <AlertDescription>{problem}</AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Key id" htmlFor="rzp-key" error={keyIdError}>
                <Input id="rzp-key" value={keyId} onChange={(e) => setKeyId(e.target.value)} placeholder="rzp_test_…" autoComplete="off" />
              </Field>
              <Field label="Key secret" htmlFor="rzp-secret">
                <Input id="rzp-secret" type="password" value={keySecret} onChange={(e) => setKeySecret(e.target.value)} autoComplete="new-password" />
              </Field>
            </div>
            <Field label="Webhook secret" htmlFor="rzp-webhook" hint={g?.webhookSecretSet ? "Leave empty to remove the current one" : "Optional, but recommended"}>
              <Input id="rzp-webhook" type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} autoComplete="new-password" />
            </Field>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><KeyRound className="size-3.5" /> Razorpay checks the keys before they are saved. Secrets are stored encrypted and never shown again.</p>
          </form>
        ) : null}
      </CardContent>
      {canEdit && g ? (
        <CardFooter className="justify-end gap-2 border-t">
          {g.configured && !editing ? (
            <>
              <Button variant="ghost" className="text-destructive" onClick={() => setDisconnecting(true)}><Unplug /> Disconnect</Button>
              <Button variant="outline" onClick={() => { setKeyId(g.keyId ?? ""); setEditing(true); }}>Replace keys</Button>
            </>
          ) : (
            <>
              {editing ? <Button variant="ghost" onClick={() => { setEditing(false); setProblem(null); }}>Cancel</Button> : null}
              <Button type="submit" form="rzp-form" loading={save.isPending} disabled={!keyId || !keySecret || !!keyIdError}>Connect Razorpay</Button>
            </>
          )}
        </CardFooter>
      ) : null}
      <ConfirmDialog
        open={disconnecting}
        onOpenChange={setDisconnecting}
        title="Disconnect Razorpay?"
        description="The keys are deleted. Checkout falls back to pending payments, and refunds of earlier online payments fail until you connect again."
        confirmLabel="Disconnect"
        destructive
        onConfirm={() => remove.mutateAsync()}
      />
    </Card>
  );
}
