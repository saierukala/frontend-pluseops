"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FormDialog, Field } from "@/components/app/form-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { variantsApi } from "@/lib/api/modules/variants";
import type { ProductVariant } from "@/lib/api/types";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";

const money = z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Use a price like 49 or 49.99");

const schema = z.object({
  sku: z.string().trim().min(1, "SKU is required").max(100),
  barcode: z.string().trim().max(100).optional(),
  price: money,
  costPrice: z.union([money, z.literal("")]).optional(),
  status: z.enum(["ACTIVE", "DRAFT", "INACTIVE"]),
});
type Values = z.infer<typeof schema>;

export function VariantFormDialog({
  open,
  onOpenChange,
  productId,
  variant,
  defaultPrice,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  variant?: ProductVariant;
  defaultPrice?: string | null;
}) {
  const queryClient = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      sku: variant?.sku ?? "",
      barcode: variant?.barcode ?? "",
      price: variant?.price ?? defaultPrice ?? "",
      costPrice: variant?.costPrice ?? "",
      status: variant?.status ?? "ACTIVE",
    },
  });

  const save = useMutation({
    mutationFn: (v: Values) => {
      const body = { sku: v.sku, barcode: v.barcode || null, price: v.price, costPrice: v.costPrice || null, status: v.status };
      return variant ? variantsApi.update(productId, variant.id, body) : variantsApi.create(productId, body);
    },
    onSuccess: (saved) => {
      toast.success(variant ? "Variant updated" : "Variant created", { description: saved.sku });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
    },
    onError: (error) => {
      if (!applyApiFieldErrors(error, form.setError, Object.keys(schema.shape))) toastError(error, "Couldn't save variant");
    },
  });

  const { errors } = form.formState;
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={variant ? `Edit ${variant.sku}` : "New variant"}
      description="A variant is a sellable SKU with its own price and stock."
      submitLabel={variant ? "Save changes" : "Create variant"}
      pending={save.isPending}
      onSubmit={form.handleSubmit((v) => save.mutate(v))}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SKU" htmlFor="v-sku" error={errors.sku?.message}>
          <Input id="v-sku" autoFocus placeholder="HOOD-M" className="font-mono" {...form.register("sku")} />
        </Field>
        <Field label="Barcode" htmlFor="v-barcode" error={errors.barcode?.message}>
          <Input id="v-barcode" placeholder="Optional" {...form.register("barcode")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price" htmlFor="v-price" error={errors.price?.message}>
          <Input id="v-price" inputMode="decimal" leftElement={<span className="text-xs">$</span>} {...form.register("price")} />
        </Field>
        <Field label="Cost" htmlFor="v-cost" error={errors.costPrice?.message} hint="Used for margin reporting">
          <Input id="v-cost" inputMode="decimal" leftElement={<span className="text-xs">$</span>} placeholder="Optional" {...form.register("costPrice")} />
        </Field>
      </div>
      <Field label="Status">
        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <Select
              options={[
                { value: "ACTIVE", label: "Active — can be ordered" },
                { value: "DRAFT", label: "Draft" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />
      </Field>
    </FormDialog>
  );
}
