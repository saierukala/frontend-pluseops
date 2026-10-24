"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Info, Plus, Trash2, UserPlus } from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { Field } from "@/components/app/form-dialog";
import { ComboboxField } from "@/components/app/combobox-field";
import { CustomerDialog } from "@/features/customers/customer-dialog";
import { useVariantLookup, useWarehouseOptions } from "@/features/catalog/lookups";
import { customersApi } from "@/lib/api/modules/customers";
import { ordersApi } from "@/lib/api/modules/orders";
import { usePermission } from "@/lib/auth/permission-context";
import { useUrlState } from "@/hooks/use-url-state";
import { formatMoney, fullName } from "@/lib/format";
import { errorMessage } from "@/lib/api-errors";

const schema = z.object({
  customerId: z.string().min(1, "Choose a customer"),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1, "Choose an item"),
        warehouseId: z.string().min(1, "Choose a warehouse"),
        quantity: z.coerce.number().int("Whole units only").positive("At least 1"),
      })
    )
    .min(1, "Add at least one item"),
  shippingTotal: z.string().trim().regex(/^(\d+(\.\d{1,2})?)?$/, "Use an amount like 7.50"),
});
type Values = z.infer<typeof schema>;

export default function NewOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const { get } = useUrlState();
  const variants = useVariantLookup();
  const warehouses = useWarehouseOptions();
  const customers = useQuery({ queryKey: ["customers", "options"], queryFn: () => customersApi.listEnvelope({ limit: 100, sortBy: "firstName", sortOrder: "asc" }) });
  const [addingCustomer, setAddingCustomer] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { customerId: get("customer"), items: [{ variantId: "", warehouseId: "", quantity: 1 }], shippingTotal: "" },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const items = useWatch({ control: form.control, name: "items" });
  const shipping = useWatch({ control: form.control, name: "shippingTotal" });

  // Fill empty warehouse slots with the default once warehouses load
  React.useEffect(() => {
    if (!warehouses.defaultId) return;
    form.getValues("items").forEach((item, i) => {
      if (!item.warehouseId) form.setValue(`items.${i}.warehouseId`, warehouses.defaultId!);
    });
  }, [warehouses.defaultId, form]);

  // Preview only — the server derives authoritative totals, tax and reservations on submit
  const estimate = items.reduce((sum, item) => sum + Number(variants.byId.get(item.variantId)?.variant.price ?? 0) * (Number(item.quantity) || 0), 0) + (Number(shipping) || 0);

  const create = useMutation({
    mutationFn: (v: Values) =>
      ordersApi.create({
        customerId: v.customerId,
        items: v.items.map((i) => ({ productVariantId: i.variantId, warehouseId: i.warehouseId, quantity: i.quantity })),
        shippingTotal: v.shippingTotal || undefined,
      }),
    onSuccess: (order) => {
      toast.success("Order created", { description: `Total ${formatMoney(order.total, order.currency)} · stock reserved` });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      router.push(`/orders/${order.id}` as never);
    },
    onError: (e) => setServerError(errorMessage(e, "Couldn't create order")),
  });

  const { errors } = form.formState;
  const customerOptions = (customers.data?.data ?? []).map((c) => ({ value: c.id, label: fullName(c), hint: c.email }));
  const variantOptions = variants.options.filter((o) => o.variant.status === "ACTIVE").map((o) => ({ value: o.variant.id, label: o.label, hint: formatMoney(o.variant.price) }));

  return (
    <PageBody className="mx-auto w-full max-w-5xl">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground" asChild>
        <Link href={"/orders" as never}>
          <ArrowLeft /> Orders
        </Link>
      </Button>
      <PageHeader title="Create order" description="Stock is reserved from the chosen warehouse as soon as the order is placed." />

      <form
        className="grid gap-6 lg:grid-cols-3"
        noValidate
        onSubmit={form.handleSubmit((v) => {
          setServerError(null);
          create.mutate(v);
        })}
      >
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              {hasPermission("customer:create") ? (
                <CardAction>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAddingCustomer(true)}>
                    <UserPlus /> New customer
                  </Button>
                </CardAction>
              ) : null}
            </CardHeader>
            <CardContent>
              <Field label="Bill to" error={errors.customerId?.message}>
                <Controller
                  control={form.control}
                  name="customerId"
                  render={({ field }) => <ComboboxField value={field.value} onChange={field.onChange} options={customerOptions} invalid={Boolean(errors.customerId)} placeholder={customers.isLoading ? "Loading customers…" : "Search customers"} emptyText="No customers found" />}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>Only active variants can be ordered.</CardDescription>
              <CardAction>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ variantId: "", warehouseId: warehouses.defaultId ?? "", quantity: 1 })}>
                  <Plus /> Add item
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {fields.map((f, i) => {
                const line = variants.byId.get(items[i]?.variantId ?? "");
                const itemErrors = errors.items?.[i];
                return (
                  <div key={f.id} className="grid grid-cols-[minmax(0,1fr)_5rem_auto] items-start gap-3 rounded-lg border bg-muted/20 p-3 xl:grid-cols-[minmax(0,1fr)_10rem_5rem_auto]">
                    <Field label="Item" error={itemErrors?.variantId?.message} className="col-span-full xl:col-span-1">
                      <Controller control={form.control} name={`items.${i}.variantId`} render={({ field }) => <ComboboxField value={field.value} onChange={field.onChange} options={variantOptions} invalid={Boolean(itemErrors?.variantId)} placeholder="Search product or SKU" />} />
                    </Field>
                    <Field label="Ship from" error={itemErrors?.warehouseId?.message}>
                      <Controller control={form.control} name={`items.${i}.warehouseId`} render={({ field }) => <Select options={warehouses.options} value={field.value} onValueChange={field.onChange} placeholder="Warehouse" />} />
                    </Field>
                    <Field label="Qty" htmlFor={`qty-${i}`} error={itemErrors?.quantity?.message}>
                      <Input id={`qty-${i}`} type="number" min={1} className="tabular" {...form.register(`items.${i}.quantity`)} />
                    </Field>
                    <div className="flex flex-col items-end gap-1 pt-6">
                      <span className="tabular text-sm font-medium">{line ? formatMoney(Number(line.variant.price) * (Number(items[i]?.quantity) || 0)) : "—"}</span>
                      <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="Remove item" disabled={fields.length === 1} onClick={() => remove(i)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {errors.items?.root?.message ? <p className="text-sm text-destructive">{errors.items.root.message}</p> : null}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field label="Shipping" htmlFor="shipping" error={errors.shippingTotal?.message}>
                <Input id="shipping" inputMode="decimal" placeholder="0.00" className="tabular" leftElement={<span className="text-xs">$</span>} {...form.register("shippingTotal")} />
              </Field>
              <div className="flex items-baseline justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">Estimated total</span>
                <span className="tabular text-2xl font-semibold">{formatMoney(estimate)}</span>
              </div>
              <p className="flex gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" /> Final totals, discounts and tax are calculated by the server when the order is placed.
              </p>
              {serverError ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{serverError}</p> : null}
              <Button type="submit" size="lg" loading={create.isPending} className="w-full">
                Place order
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>

      <CustomerDialog open={addingCustomer} onOpenChange={setAddingCustomer} onSaved={(c) => form.setValue("customerId", c.id, { shouldValidate: true })} />
    </PageBody>
  );
}
