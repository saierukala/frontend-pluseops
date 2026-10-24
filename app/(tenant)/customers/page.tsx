"use client";

import * as React from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Pencil, Plus, Star, ShoppingCart, Trash2, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { DataTable, SearchInput, TableToolbar, type Column } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { RowActions } from "@/components/app/row-actions";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { CustomerDialog } from "@/features/customers/customer-dialog";
import { EmptyState } from "@/components/app/states";
import { Can } from "@/components/auth/can";
import { UserAvatar } from "@/components/layout/app-sidebar";
import { customersApi, type Customer, type CustomerAddress } from "@/lib/api/modules/customers";
import { AddressDialog, formatAddress } from "@/features/customers/address-dialog";
import { usePermission } from "@/lib/auth/permission-context";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDate, formatMoney, formatRelative, fullName, humanize, shortId } from "@/lib/format";
import { toastError } from "@/lib/api-errors";

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const { get, set, page } = useUrlState();
  const search = get("q");
  const [dialog, setDialog] = React.useState<{ open: boolean; customer?: Customer }>({ open: get("new") === "1" });
  const [deleting, setDeleting] = React.useState<Customer | null>(null);
  const [viewing, setViewing] = React.useState<Customer | null>(null);

  const query = useQuery({
    queryKey: ["customers", { page, search }],
    queryFn: () => customersApi.listEnvelope({ page, limit: 20, search: search || undefined }),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (c: Customer) => customersApi.remove(c.id),
    onSuccess: (_, c) => {
      toast.success("Customer deleted", { description: fullName(c) });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e) => toastError(e, "Couldn't delete customer"),
  });

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      cell: (c) => (
        <div className="flex items-center gap-3">
          <UserAvatar first={c.firstName} last={c.lastName} className="size-9 rounded-full" />
          <div className="min-w-0">
            <p className="truncate font-medium">{fullName(c)}</p>
            <p className="truncate text-xs text-muted-foreground">{c.email}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", header: "Phone", cell: (c) => <span className="text-muted-foreground">{c.phone || "—"}</span>, headerClassName: "hidden md:table-cell", className: "hidden md:table-cell" },
    { key: "account", header: "Store account", cell: (c) => (c.lastLoginAt || c.emailVerifiedAt ? <StatusPill tone="success" label="Active" /> : <span className="text-muted-foreground">—</span>), headerClassName: "hidden lg:table-cell", className: "hidden lg:table-cell" },
    { key: "since", header: "Customer since", cell: (c) => <span className="text-muted-foreground">{formatDate(c.createdAt)}</span>, headerClassName: "hidden sm:table-cell", className: "hidden sm:table-cell" },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-12",
      cell: (c) => (
        <RowActions
          actions={[
            { label: "Edit", icon: Pencil, onSelect: () => setDialog({ open: true, customer: c }), hidden: !hasPermission("customer:update") },
            { label: "Delete", icon: Trash2, destructive: true, onSelect: () => setDeleting(c), hidden: !hasPermission("customer:delete") },
          ]}
        />
      ),
    },
  ];

  return (
    <PageBody>
      <PageHeader
        title="Customers"
        description="People who buy from you. Every order belongs to a customer."
        actions={
          <Can permission="customer:create">
            <Button onClick={() => setDialog({ open: true })}>
              <Plus /> Add customer
            </Button>
          </Can>
        }
      />
      <Card className="gap-0 py-0">
        <TableToolbar>
          <SearchInput value={search} onChange={(q) => set({ q })} placeholder="Search name, email or phone…" />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={query.data?.data}
          rowKey={(c) => c.id}
          loading={query.isFetching}
          error={query.error}
          onRetry={() => query.refetch()}
          meta={query.data?.meta}
          onPageChange={(p) => set({ page: p })}
          onRowClick={setViewing}
          empty={
            <EmptyState
              icon={UserRound}
              title={search ? "No matching customers" : "No customers yet"}
              description={search ? undefined : "Add customers to start taking orders."}
              action={!search && hasPermission("customer:create") ? <Button size="sm" onClick={() => setDialog({ open: true })}><Plus /> Add customer</Button> : undefined}
            />
          }
        />
      </Card>

      <CustomerDialog open={dialog.open} customer={dialog.customer} onOpenChange={(o) => { setDialog((s) => ({ ...s, open: o })); if (!o && get("new")) set({ new: null }); }} />
      <CustomerSheet customer={viewing} onOpenChange={(o) => !o && setViewing(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting ? fullName(deleting) : "customer"}?`}
        description="They're removed from your customer list. Their past orders are kept."
        confirmLabel="Delete customer"
        destructive
        onConfirm={() => remove.mutateAsync(deleting!)}
      />
    </PageBody>
  );
}

function CustomerSheet({ customer, onOpenChange }: { customer: Customer | null; onOpenChange: (o: boolean) => void }) {
  const orders = useQuery({
    queryKey: ["orders", { customerId: customer?.id }],
    queryFn: () => customersApi.listOrdersEnvelope(customer!.id, { limit: 10 }),
    enabled: Boolean(customer),
  });

  return (
    <Sheet open={Boolean(customer)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        {customer ? (
          <>
            <SheetHeader className="border-b pb-5">
              <div className="flex items-center gap-3">
                <UserAvatar first={customer.firstName} last={customer.lastName} className="size-12 rounded-full" />
                <div className="min-w-0">
                  <SheetTitle className="truncate">{fullName(customer)}</SheetTitle>
                  <SheetDescription className="truncate">{customer.email}</SheetDescription>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Phone</dt>
                  <dd>{customer.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Customer since</dt>
                  <dd>{formatDate(customer.createdAt)}</dd>
                </div>
              </dl>
            </SheetHeader>
            <div className="flex flex-col gap-3 overflow-y-auto px-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Orders</h3>
                <Can permission="order:create">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/orders/new?customer=${customer.id}` as never}>
                      <Plus /> New order
                    </Link>
                  </Button>
                </Can>
              </div>
              {orders.isLoading ? (
                Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)
              ) : orders.data?.data.length ? (
                <ul className="divide-y rounded-lg border">
                  {orders.data.data.map((o) => (
                    <li key={o.id}>
                      <Link href={`/orders/${o.id}` as never} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">#{shortId(o.id)}</p>
                          <p className="text-xs text-muted-foreground">{formatRelative(o.createdAt)}</p>
                        </div>
                        <StatusPill status={o.status} />
                        <span className="tabular w-20 text-right text-sm font-medium">{formatMoney(o.total, o.currency)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={ShoppingCart} title="No orders yet" className="rounded-lg border border-dashed py-10" />
              )}
              <AddressBook customerId={customer.id} />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function AddressBook({ customerId }: { customerId: string }) {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canEdit = hasPermission("customer:update");
  const [dialog, setDialog] = React.useState<{ open: boolean; address?: CustomerAddress }>({ open: false });
  const addresses = useQuery({ queryKey: ["customer", customerId, "addresses"], queryFn: () => customersApi.listAddresses(customerId) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["customer", customerId, "addresses"] });

  const makeDefault = useMutation({
    mutationFn: (a: CustomerAddress) => customersApi.updateAddress(customerId, a.id, { isDefault: true }),
    onSuccess: invalidate,
    onError: (e) => toastError(e, "Couldn't update address"),
  });
  const remove = useMutation({
    mutationFn: (a: CustomerAddress) => customersApi.removeAddress(customerId, a.id),
    onSuccess: () => {
      toast.success("Address removed");
      invalidate();
    },
    onError: (e) => toastError(e, "Couldn't remove address"),
  });

  return (
    <div className="flex flex-col gap-3 pb-6 pt-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Addresses</h3>
        {canEdit ? (
          <Button size="sm" variant="outline" onClick={() => setDialog({ open: true })}>
            <Plus /> Add address
          </Button>
        ) : null}
      </div>
      {addresses.isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : addresses.data?.length ? (
        <ul className="flex flex-col gap-2">
          {addresses.data.map((a) => (
            <li key={a.id} className="group flex items-start gap-3 rounded-lg border p-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="flex flex-wrap items-center gap-1.5 font-medium">
                  {a.label || humanize(a.type)}
                  <StatusPill tone={a.type === "SHIPPING" ? "info" : "brand"} label={humanize(a.type)} />
                  {a.isDefault ? <StatusPill tone="success" label="Default" /> : null}
                </p>
                <p className="mt-0.5 text-muted-foreground">{formatAddress(a)}</p>
              </div>
              {canEdit ? (
                <RowActions
                  actions={[
                    { label: "Edit", icon: Pencil, onSelect: () => setDialog({ open: true, address: a }) },
                    { label: "Make default", icon: Star, onSelect: () => makeDefault.mutate(a), hidden: a.isDefault },
                    { label: "Remove", icon: Trash2, destructive: true, onSelect: () => remove.mutate(a) },
                  ]}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={MapPin} title="No saved addresses" className="rounded-lg border border-dashed py-8" />
      )}
      <AddressDialog open={dialog.open} onOpenChange={(o) => setDialog((s) => ({ ...s, open: o }))} customerId={customerId} address={dialog.address} />
    </div>
  );
}
