"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, LifeBuoy, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/app/form-dialog";
import { DataTable, type Column } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { apiClient } from "@/lib/api/client";
import { platformApi, type SupportSession } from "@/lib/api/modules/platform";
import { toastError } from "@/lib/api-errors";
import { formatDateTime, formatMoney, fullName, humanize, shortId } from "@/lib/format";
import { cn } from "@/lib/utils";

type Row = Record<string, unknown> & { id: string };

// What a support session can look at. Each view is a read-only GET with the support token.
const VIEWS: Array<{ key: string; label: string; path: string; columns: Column<Row>[] }> = [
  {
    key: "orders",
    label: "Orders",
    path: "/orders",
    columns: [
      { key: "id", header: "Order", cell: (r) => <span className="font-mono text-xs">#{shortId(r.id)}</span> },
      { key: "customer", header: "Customer", cell: (r) => fullName(r.customer as never) },
      { key: "total", header: "Total", cell: (r) => <span className="tabular">{formatMoney(r.total as string, r.currency as string)}</span> },
      { key: "status", header: "Status", cell: (r) => <StatusPill status={r.status as string} /> },
      { key: "date", header: "Created", cell: (r) => <span className="text-muted-foreground">{formatDateTime(r.createdAt as string)}</span> },
    ],
  },
  {
    key: "products",
    label: "Products",
    path: "/products",
    columns: [
      { key: "name", header: "Product", cell: (r) => <span className="font-medium">{r.name as string}</span> },
      { key: "brand", header: "Brand", cell: (r) => (r.brand as string) ?? "—" },
      { key: "status", header: "Status", cell: (r) => <StatusPill status={r.status as string} /> },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    path: "/customers",
    columns: [
      { key: "name", header: "Customer", cell: (r) => fullName(r as never) },
      { key: "email", header: "Email", cell: (r) => r.email as string },
      { key: "date", header: "Since", cell: (r) => <span className="text-muted-foreground">{formatDateTime(r.createdAt as string)}</span> },
    ],
  },
  {
    key: "users",
    label: "Team",
    path: "/users",
    columns: [
      { key: "name", header: "User", cell: (r) => fullName(r as never) },
      { key: "email", header: "Email", cell: (r) => r.email as string },
      { key: "status", header: "Status", cell: (r) => <StatusPill status={r.status as string} /> },
    ],
  },
  {
    key: "audit",
    label: "Audit log",
    path: "/audit-logs",
    columns: [
      { key: "action", header: "Action", cell: (r) => humanize(`${r.resource ?? ""} ${r.action ?? ""}`) },
      { key: "date", header: "When", cell: (r) => <span className="text-muted-foreground">{formatDateTime(r.createdAt as string)}</span> },
    ],
  },
];

function useCountdown(until?: string) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  const left = until ? Math.max(0, new Date(until).getTime() - now) : 0;
  return { left, label: `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}` };
}

function SupportView({ session, viewKey }: { session: SupportSession; viewKey: string }) {
  const view = VIEWS.find((v) => v.key === viewKey)!;
  const [page, setPage] = React.useState(1);
  const query = useQuery({
    queryKey: ["support", session.sessionId, view.key, page],
    // The support token goes on this request only: it never replaces the signed-in platform session
    queryFn: () => apiClient.requestEnvelope<Row[]>(view.path, { params: { page, limit: 10 }, headers: { Authorization: `Bearer ${session.accessToken}` }, skipAuthRefresh: true }),
    retry: false,
  });
  return <DataTable columns={view.columns} rows={query.data?.data} rowKey={(r) => r.id} loading={query.isFetching} error={query.error} onRetry={() => query.refetch()} meta={query.data?.meta} onPageChange={setPage} skeletonRows={5} />;
}

/**
 * Read-only support access to one tenant (POST /platform/tenants/:id/support-sessions). The 30-minute token is kept
 * in memory for this card only; leaving the page or pressing End closes the session, and every view is logged.
 */
export function SupportSessionCard({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const [reason, setReason] = React.useState("");
  const [session, setSession] = React.useState<SupportSession | null>(null);
  const [view, setView] = React.useState(VIEWS[0].key);
  const { left, label } = useCountdown(session?.expiresAt);
  const sessionRef = React.useRef<SupportSession | null>(null);
  React.useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const start = useMutation({
    mutationFn: () => platformApi.startSupportSession(tenantId, reason.trim()),
    onSuccess: (s) => {
      setSession(s);
      setReason("");
      toast.success("Support session started", { description: `Read-only access to ${s.tenant.name} for 30 minutes` });
    },
    onError: (e) => toastError(e, "Couldn't start a support session"),
  });
  const end = useMutation({
    mutationFn: (s: SupportSession) => platformApi.endSupportSession(s.sessionId),
    onSettled: () => setSession(null),
    onSuccess: () => toast.success("Support session ended"),
    onError: (e) => toastError(e, "Couldn't end the session; it expires on its own"),
  });

  // Close the session when leaving the page
  React.useEffect(() => () => {
    if (sessionRef.current) platformApi.endSupportSession(sessionRef.current.sessionId).catch(() => {});
  }, []);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session && left === 0) setSession(null);
  }, [session, left]);

  return (
    <Card className={cn(session && "border-amber-500/50")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><LifeBuoy className="size-4" /> Support access</CardTitle>
        <CardDescription>
          {session ? `Viewing ${tenantName} read-only · ends in ${label}` : `Look at ${tenantName}'s data read-only for 30 minutes. The reason and every view are logged.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!session ? (
          <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); start.mutate(); }}>
            <Field label="Reason" htmlFor="support-reason" hint="At least 5 characters, e.g. the ticket number">
              <Textarea id="support-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ticket #1234: order totals look wrong" />
            </Field>
            <Button type="submit" loading={start.isPending} disabled={reason.trim().length < 5} className="self-start"><Eye /> Start read-only session</Button>
          </form>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {VIEWS.map((v) => (
                <Button key={v.key} size="sm" variant={view === v.key ? "default" : "outline"} onClick={() => setView(v.key)}>{v.label}</Button>
              ))}
              <Button size="sm" variant="ghost" className="ml-auto text-destructive" loading={end.isPending} onClick={() => end.mutate(session)}><LogOut /> End session</Button>
            </div>
            <div className="-mx-6 border-t">
              <SupportView key={view} session={session} viewKey={view} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
