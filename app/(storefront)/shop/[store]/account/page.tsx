"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronRight, MapPin, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-primitive";
import { Field } from "@/components/app/form-dialog";
import { StatusPill } from "@/components/app/status-pill";
import { EmptyState, ErrorState } from "@/components/app/states";
import { RequireShopper } from "@/features/storefront/require-shopper";
import { ShopAddressForm, formatShopAddress } from "@/features/storefront/address-form";
import { useShop } from "@/features/storefront/shop-context";
import { useUrlState } from "@/hooks/use-url-state";
import type { ShopAddress } from "@/lib/storefront/api";
import { formatDate, fullName } from "@/lib/format";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";

export default function AccountPage() {
  return (
    <RequireShopper>
      <Account />
    </RequireShopper>
  );
}

function Account() {
  const { shopper } = useShop();
  const { get, set } = useUrlState();
  const tab = get("tab", "orders");
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Hi, {shopper?.firstName}</h1>
        <p className="text-muted-foreground">{shopper?.email}</p>
      </div>
      <Tabs value={tab} onValueChange={(t) => set({ tab: t === "orders" ? null : t })} className="gap-6">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <Orders />
        </TabsContent>
        <TabsContent value="addresses">
          <Addresses />
        </TabsContent>
        <TabsContent value="profile">
          <Profile />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Orders() {
  const { client, slug, href, money } = useShop();
  const [page, setPage] = React.useState(1);
  const orders = useQuery({ queryKey: ["shop", slug, "orders", page], queryFn: () => client.listOrders({ page, limit: 10 }), placeholderData: keepPreviousData });

  if (orders.error) return <ErrorState error={orders.error} onRetry={() => orders.refetch()} />;
  if (orders.isLoading) return <div className="space-y-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>;
  if (!orders.data?.data.length) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="When you place an order, you can track it here."
        action={
          <Button asChild className="rounded-full">
            <Link href={href() as never}>Start shopping</Link>
          </Button>
        }
      />
    );
  }
  const meta = orders.data.meta;
  return (
    <div className="flex flex-col gap-3">
      {orders.data.data.map((o) => (
        <Link key={o.id} href={href(`/account/orders/${o.id}`) as never} className="group flex items-center gap-4 rounded-2xl border p-4 transition-colors hover:bg-muted/40">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Package className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Order #{o.number}</p>
            <p className="truncate text-sm text-muted-foreground">
              {formatDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.quantity, 0)} item(s)
            </p>
          </div>
          <StatusPill status={o.status} className="hidden sm:inline-flex" />
          <span className="tabular w-24 text-right font-semibold">{money(o.total, o.currency)}</span>
          <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      ))}
      {meta && meta.totalPages > 1 ? (
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Newer
          </Button>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>
            Older
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function Addresses() {
  const { client, slug } = useShop();
  const queryClient = useQueryClient();
  const [editing, setEditing] = React.useState<ShopAddress | "new" | null>(null);
  const addresses = useQuery({ queryKey: ["shop", slug, "addresses"], queryFn: () => client.listAddresses() });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["shop", slug, "addresses"] });
  const remove = useMutation({ mutationFn: (a: ShopAddress) => client.deleteAddress(a.id), onSuccess: () => { toast.success("Address removed"); invalidate(); }, onError: (e) => toastError(e) });
  const makeDefault = useMutation({ mutationFn: (a: ShopAddress) => client.updateAddress(a.id, { isDefault: true }), onSuccess: invalidate, onError: (e) => toastError(e) });

  if (editing) {
    return (
      <div className="rounded-2xl border p-5 sm:p-6">
        <h2 className="mb-4 font-semibold">{editing === "new" ? "New address" : "Edit address"}</h2>
        <ShopAddressForm
          address={editing === "new" ? undefined : editing}
          onSaved={() => {
            toast.success("Address saved");
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {addresses.isLoading ? (
        <Skeleton className="h-24 w-full rounded-2xl" />
      ) : addresses.data?.length ? (
        addresses.data.map((a) => (
          <div key={a.id} className="flex items-start gap-3 rounded-2xl border p-4">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="flex flex-wrap items-center gap-1.5 font-medium">
                {[a.firstName, a.lastName].filter(Boolean).join(" ") || "Address"}
                {a.isDefault ? <StatusPill tone="success" label="Default" /> : null}
              </p>
              <p className="text-muted-foreground">{formatShopAddress(a)}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              {!a.isDefault ? (
                <Button variant="ghost" size="sm" onClick={() => makeDefault.mutate(a)}>
                  Make default
                </Button>
              ) : null}
              <Button variant="ghost" size="icon" aria-label="Edit address" onClick={() => setEditing(a)}>
                <Pencil />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Remove address" onClick={() => remove.mutate(a)}>
                <Trash2 />
              </Button>
            </div>
          </div>
        ))
      ) : (
        <EmptyState icon={MapPin} title="No saved addresses" description="Add one now or during checkout." />
      )}
      <Button variant="outline" className="w-fit" onClick={() => setEditing("new")}>
        <Plus /> Add address
      </Button>
    </div>
  );
}

const profileSchema = z.object({ firstName: z.string().trim().min(1, "Required").max(100), lastName: z.string().trim().min(1, "Required").max(100), phone: z.string().trim().max(30) });

function Profile() {
  const { client, slug, shopper } = useShop();
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["shop", slug, "profile"], queryFn: () => client.getProfile() });
  const p = profile.data ?? shopper;
  const form = useForm<z.infer<typeof profileSchema>>({ resolver: zodResolver(profileSchema), values: { firstName: p?.firstName ?? "", lastName: p?.lastName ?? "", phone: p?.phone ?? "" } });
  const save = useMutation({
    mutationFn: (v: z.infer<typeof profileSchema>) => client.updateProfile({ ...v, phone: v.phone || null }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["shop", slug, "profile"], updated);
      toast.success("Profile updated");
      form.reset({ firstName: updated.firstName, lastName: updated.lastName, phone: updated.phone ?? "" });
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, ["firstName", "lastName", "phone"])) toastError(e, "Couldn't update profile");
    },
  });
  const { errors, isDirty } = form.formState;

  return (
    <form className="flex flex-col gap-4 rounded-2xl border p-5 sm:p-6" noValidate onSubmit={form.handleSubmit((v) => save.mutate(v))}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First name" htmlFor="sp-first" error={errors.firstName?.message}>
          <Input id="sp-first" {...form.register("firstName")} />
        </Field>
        <Field label="Last name" htmlFor="sp-last" error={errors.lastName?.message}>
          <Input id="sp-last" {...form.register("lastName")} />
        </Field>
      </div>
      <Field label="Phone" htmlFor="sp-phone">
        <Input id="sp-phone" type="tel" {...form.register("phone")} />
      </Field>
      <Field label="Email" htmlFor="sp-email" hint="Contact the store to change your email.">
        <Input id="sp-email" value={p?.email ?? ""} disabled />
      </Field>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Signed in as {fullName(p)}</p>
        <Button type="submit" loading={save.isPending} disabled={!isDirty}>
          Save
        </Button>
      </div>
    </form>
  );
}
