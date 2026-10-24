"use client";

import * as React from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, CheckCheck, CheckCircle2, Info, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { FilterSelect, TableToolbar } from "@/components/app/data-table";
import { EmptyState, ErrorState } from "@/components/app/states";
import { Can } from "@/components/auth/can";
import { notificationsApi, type Notification } from "@/lib/api/modules/notifications";
import { usePermission } from "@/lib/auth/permission-context";
import { useUrlState } from "@/hooks/use-url-state";
import { formatRelative } from "@/lib/format";
import { toastError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ICONS = { INFO: Info, SUCCESS: CheckCircle2, WARNING: AlertTriangle, ERROR: XCircle } as const;
const TONES = { INFO: "text-info bg-info/10", SUCCESS: "text-success bg-success/10", WARNING: "text-warning bg-warning/10", ERROR: "text-destructive bg-destructive/10" } as const;

function referenceHref(n: Notification & { referenceType?: string | null; referenceId?: string | null }) {
  if (n.referenceType === "ORDER" && n.referenceId) return `/orders/${n.referenceId}`;
  if (n.referenceType === "PRODUCT" && n.referenceId) return `/products/${n.referenceId}`;
  return null;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const { get, set, page } = useUrlState();
  const filter = get("show", "all");

  const query = useQuery({
    queryKey: ["notifications", "page", { page, filter }],
    queryFn: () => notificationsApi.listEnvelope({ page, limit: 20, isRead: filter === "unread" ? false : undefined }),
    placeholderData: keepPreviousData,
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const markRead = useMutation({ mutationFn: (id: string) => notificationsApi.markRead(id), onSuccess: invalidate, onError: (e) => toastError(e) });
  const markAll = useMutation({ mutationFn: () => notificationsApi.markAllRead(), onSuccess: invalidate, onError: (e) => toastError(e) });

  const meta = query.data?.meta;
  const canUpdate = hasPermission("notification:update");

  return (
    <PageBody className="mx-auto w-full max-w-4xl">
      <PageHeader
        title="Notifications"
        description="Order activity, stock alerts and system messages for your workspace."
        actions={
          <Can permission="notification:update">
            <Button variant="outline" onClick={() => markAll.mutate()} loading={markAll.isPending}>
              <CheckCheck /> Mark all as read
            </Button>
          </Can>
        }
      />
      <Card className="gap-0 py-0">
        <TableToolbar>
          <FilterSelect value={filter} onChange={(v) => set({ show: v })} allLabel="All notifications" options={[{ value: "unread", label: "Unread only" }]} />
        </TableToolbar>
        {query.error ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : query.isLoading ? (
          <div className="space-y-4 p-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : query.data?.data.length ? (
          <ul className="divide-y">
            {query.data.data.map((n) => {
              const Icon = ICONS[n.type as keyof typeof ICONS] ?? Bell;
              const href = referenceHref(n as Notification & { referenceType?: string; referenceId?: string });
              return (
                <li key={n.id} className={cn("flex gap-4 px-5 py-4", !n.isRead && "bg-primary/[0.03]")}>
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TONES[n.type as keyof typeof TONES] ?? "bg-muted text-muted-foreground")}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      {!n.isRead ? <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-label="Unread" /> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                      <span>{formatRelative(n.createdAt)}</span>
                      {href ? (
                        <Link href={href as never} className="font-medium text-primary hover:underline" onClick={() => !n.isRead && canUpdate && markRead.mutate(n.id)}>
                          View
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  {!n.isRead && canUpdate ? (
                    <Button variant="ghost" size="sm" className="shrink-0 text-muted-foreground" onClick={() => markRead.mutate(n.id)}>
                      Mark read
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon={Bell} title={filter === "unread" ? "No unread notifications" : "No notifications yet"} description="You're all caught up." />
        )}
        {meta && meta.totalPages > 1 ? (
          <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
            <Button variant="outline" size="icon" className="size-8" aria-label="Previous page" disabled={page <= 1} onClick={() => set({ page: page - 1 })}>
              <ChevronLeft />
            </Button>
            <span className="tabular text-xs text-muted-foreground">
              Page {page} of {meta.totalPages}
            </span>
            <Button variant="outline" size="icon" className="size-8" aria-label="Next page" disabled={page >= meta.totalPages} onClick={() => set({ page: page + 1 })}>
              <ChevronRight />
            </Button>
          </div>
        ) : null}
      </Card>
    </PageBody>
  );
}
