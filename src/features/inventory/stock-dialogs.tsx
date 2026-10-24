"use client";

import * as React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { FormDialog, Field } from "@/components/app/form-dialog";
import { ComboboxField } from "@/components/app/combobox-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { inventoryApi } from "@/lib/api/modules/inventory";
import { useVariantLookup, useWarehouseOptions } from "@/features/catalog/lookups";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

function useInvalidateStock() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

const adjustSchema = z.object({
  variantId: z.string().min(1, "Choose a variant"),
  warehouseId: z.string().min(1, "Choose a warehouse"),
  direction: z.enum(["in", "out"]),
  quantity: z.coerce.number().int("Whole units only").positive("Enter a quantity above zero"),
  reason: z.string().trim().max(500).optional(),
});
type AdjustValues = z.infer<typeof adjustSchema>;

export function AdjustStockDialog({ open, onOpenChange, variantId, warehouseId }: { open: boolean; onOpenChange: (o: boolean) => void; variantId?: string; warehouseId?: string }) {
  const variants = useVariantLookup(open);
  const warehouses = useWarehouseOptions(open);
  const invalidate = useInvalidateStock();
  const form = useForm<AdjustValues>({
    resolver: zodResolver(adjustSchema),
    values: { variantId: variantId ?? "", warehouseId: warehouseId ?? warehouses.defaultId ?? "", direction: "in", quantity: 1, reason: "" },
  });
  const direction = useWatch({ control: form.control, name: "direction" });

  const save = useMutation({
    mutationFn: (v: AdjustValues) =>
      inventoryApi.adjust({ variantId: v.variantId, warehouseId: v.warehouseId, quantityChanged: v.direction === "in" ? v.quantity : -v.quantity, reason: v.reason || undefined }),
    onSuccess: ({ movement }) => {
      toast.success("Stock adjusted", { description: `${movement.quantityBefore} → ${movement.quantityAfter} units` });
      invalidate();
      onOpenChange(false);
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, ["variantId", "warehouseId", "reason"])) toastError(e, "Couldn't adjust stock");
    },
  });
  const { errors } = form.formState;

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Adjust stock" description="Record received goods, corrections or write-offs. Every change is logged as a movement." submitLabel="Apply adjustment" pending={save.isPending} onSubmit={form.handleSubmit((v) => save.mutate(v))}>
      <Field label="Variant" error={errors.variantId?.message}>
        <Controller
          control={form.control}
          name="variantId"
          render={({ field }) => (
            <ComboboxField value={field.value} onChange={field.onChange} invalid={Boolean(errors.variantId)} placeholder={variants.isLoading ? "Loading…" : "Search product or SKU"} options={variants.options.map((o) => ({ value: o.variant.id, label: o.label }))} />
          )}
        />
      </Field>
      <Field label="Warehouse" error={errors.warehouseId?.message}>
        <Controller control={form.control} name="warehouseId" render={({ field }) => <Select options={warehouses.options} value={field.value} onValueChange={field.onChange} placeholder="Choose warehouse" />} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Direction">
          <div className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1" role="radiogroup" aria-label="Direction">
            {(["in", "out"] as const).map((d) => (
              <Button
                key={d}
                type="button"
                variant="ghost"
                role="radio"
                aria-checked={direction === d}
                onClick={() => form.setValue("direction", d)}
                className={cn("h-8", direction === d && "bg-background shadow-xs hover:bg-background")}
              >
                {d === "in" ? <Plus /> : <Minus />} {d === "in" ? "Add" : "Remove"}
              </Button>
            ))}
          </div>
        </Field>
        <Field label="Quantity" htmlFor="adj-qty" error={errors.quantity?.message}>
          <Input id="adj-qty" type="number" min={1} step={1} className="tabular" {...form.register("quantity")} />
        </Field>
      </div>
      <Field label="Reason" htmlFor="adj-reason" hint="e.g. Received PO-1042, cycle count, damaged in transit">
        <Input id="adj-reason" {...form.register("reason")} />
      </Field>
    </FormDialog>
  );
}

const transferSchema = z
  .object({
    variantId: z.string().min(1, "Choose a variant"),
    sourceWarehouseId: z.string().min(1, "Choose a source"),
    destinationWarehouseId: z.string().min(1, "Choose a destination"),
    quantity: z.coerce.number().int("Whole units only").positive("Enter a quantity above zero"),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.sourceWarehouseId !== v.destinationWarehouseId, { path: ["destinationWarehouseId"], message: "Pick a different warehouse" });
type TransferValues = z.infer<typeof transferSchema>;

export function TransferStockDialog({ open, onOpenChange, variantId, sourceWarehouseId }: { open: boolean; onOpenChange: (o: boolean) => void; variantId?: string; sourceWarehouseId?: string }) {
  const variants = useVariantLookup(open);
  const warehouses = useWarehouseOptions(open);
  const invalidate = useInvalidateStock();
  const form = useForm<TransferValues>({
    resolver: zodResolver(transferSchema),
    values: { variantId: variantId ?? "", sourceWarehouseId: sourceWarehouseId ?? warehouses.defaultId ?? "", destinationWarehouseId: "", quantity: 1, reason: "" },
  });

  const save = useMutation({
    mutationFn: (v: TransferValues) => inventoryApi.transfer({ ...v, reason: v.reason || undefined }),
    onSuccess: (res) => {
      toast.success("Stock transferred", { description: `${res.sourceInventory.quantity} left at source, ${res.destInventory.quantity} at destination` });
      invalidate();
      onOpenChange(false);
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, ["variantId", "sourceWarehouseId", "destinationWarehouseId", "quantity"])) toastError(e, "Couldn't transfer stock");
    },
  });
  const { errors } = form.formState;

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Transfer stock" description="Move units between warehouses in one atomic step." submitLabel="Transfer" pending={save.isPending} onSubmit={form.handleSubmit((v) => save.mutate(v))}>
      <Field label="Variant" error={errors.variantId?.message}>
        <Controller
          control={form.control}
          name="variantId"
          render={({ field }) => <ComboboxField value={field.value} onChange={field.onChange} invalid={Boolean(errors.variantId)} placeholder="Search product or SKU" options={variants.options.map((o) => ({ value: o.variant.id, label: o.label }))} />}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From" error={errors.sourceWarehouseId?.message}>
          <Controller control={form.control} name="sourceWarehouseId" render={({ field }) => <Select options={warehouses.options} value={field.value} onValueChange={field.onChange} placeholder="Source" />} />
        </Field>
        <Field label="To" error={errors.destinationWarehouseId?.message}>
          <Controller control={form.control} name="destinationWarehouseId" render={({ field }) => <Select options={warehouses.options} value={field.value} onValueChange={field.onChange} placeholder="Destination" />} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Quantity" htmlFor="tr-qty" error={errors.quantity?.message}>
          <Input id="tr-qty" type="number" min={1} step={1} className="tabular" {...form.register("quantity")} />
        </Field>
        <Field label="Reason" htmlFor="tr-reason">
          <Input id="tr-reason" placeholder="Rebalance" {...form.register("reason")} />
        </Field>
      </div>
    </FormDialog>
  );
}
