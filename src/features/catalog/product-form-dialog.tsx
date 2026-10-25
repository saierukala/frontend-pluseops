"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FormDialog, Field } from "@/components/app/form-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { productsApi } from "@/lib/api/modules/products";
import { categoriesApi } from "@/lib/api/modules/categories";
import type { Product } from "@/lib/api/types";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";
import { GST_RATE_OPTIONS, TAXABILITY_OPTIONS } from "@/lib/gst";

const NO_CATEGORY = "none";
// "Workspace rate" leaves the product on the default GST rate from Settings
const DEFAULT_RATE = "default";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  brand: z.string().trim().max(100).optional(),
  description: z.string().trim().max(5000).optional(),
  basePrice: z
    .string()
    .trim()
    .regex(/^(\d+(\.\d{1,2})?)?$/, "Use a price like 49 or 49.99")
    .optional(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]),
  categoryId: z.string(),
  hsnCode: z.string().trim().regex(/^([0-9]{4,8})?$/, "HSN/SAC is 4 to 8 digits"),
  gstRate: z.string(),
  gstTaxability: z.enum(["TAXABLE", "NIL_RATED", "EXEMPT", "NON_GST"]),
  unit: z.string().trim().max(10),
});

const RATE_OPTIONS = [{ value: DEFAULT_RATE, label: "Workspace rate" }, ...GST_RATE_OPTIONS.map((r) => ({ value: String(r), label: `${r}%` }))];
const UNIT_OPTIONS = ["pcs", "kg", "g", "l", "ml", "m", "box", "pack", "dozen", "pair"].map((u) => ({ value: u, label: u }));
type Values = z.infer<typeof schema>;

export const PRODUCT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ARCHIVED", label: "Archived" },
];

export function ProductFormDialog({ open, onOpenChange, product }: { open: boolean; onOpenChange: (open: boolean) => void; product?: Product }) {
  const queryClient = useQueryClient();
  const categories = useQuery({ queryKey: ["categories", "options"], queryFn: () => categoriesApi.listEnvelope({ limit: 100 }), enabled: open });
  const primary = product?.categories?.find((c) => c.isPrimary) ?? product?.categories?.[0];

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: product?.name ?? "",
      brand: product?.brand ?? "",
      description: product?.description ?? "",
      basePrice: product?.basePrice ?? "",
      status: product?.status ?? "ACTIVE",
      categoryId: primary?.categoryId ?? NO_CATEGORY,
      hsnCode: product?.hsnCode ?? "",
      gstRate: product?.gstRatePercent === null || product?.gstRatePercent === undefined ? DEFAULT_RATE : String(Number(product.gstRatePercent)),
      gstTaxability: product?.gstTaxability ?? "TAXABLE",
      unit: product?.unit ?? "",
    },
  });

  const save = useMutation({
    mutationFn: async (values: Values) => {
      const categoryId = values.categoryId === NO_CATEGORY ? undefined : values.categoryId;
      const body = {
        name: values.name,
        brand: values.brand || undefined,
        description: values.description || undefined,
        basePrice: values.basePrice || undefined,
        status: values.status,
        ...(categoryId ? { categories: [categoryId], primaryCategoryId: categoryId } : {}),
        hsnCode: values.hsnCode || (product ? null : undefined),
        gstRatePercent: values.gstRate === DEFAULT_RATE ? (product ? null : undefined) : Number(values.gstRate),
        gstTaxability: values.gstTaxability,
        unit: values.unit || (product ? null : undefined),
      };
      if (!product) return productsApi.create(body);
      const updated = await productsApi.update(product.id, body);
      if (categoryId && categoryId !== primary?.categoryId) await productsApi.setCategories(product.id, { categories: [categoryId], primaryCategoryId: categoryId });
      return updated;
    },
    onSuccess: (saved) => {
      toast.success(product ? "Product updated" : "Product created", { description: saved.name });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", saved.id] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      if (!applyApiFieldErrors(error, form.setError, Object.keys(schema.shape))) toastError(error, "Couldn't save product");
    },
  });

  const { errors } = form.formState;
  const categoryOptions = [{ value: NO_CATEGORY, label: "No category" }, ...(categories.data?.data ?? []).map((c) => ({ value: c.id, label: c.name }))];

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={product ? "Edit product" : "New product"}
      description={product ? "Update catalog details. Variants and pricing per SKU are managed on the product page." : "Add a product, then create its sellable variants (SKUs)."}
      submitLabel={product ? "Save changes" : "Create product"}
      pending={save.isPending}
      onSubmit={form.handleSubmit((v) => save.mutate(v))}
    >
      <Field label="Name" htmlFor="p-name" error={errors.name?.message}>
        <Input id="p-name" autoFocus placeholder="Everyday Hoodie" {...form.register("name")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand" htmlFor="p-brand" error={errors.brand?.message}>
          <Input id="p-brand" placeholder="Northwind" {...form.register("brand")} />
        </Field>
        <Field label="Base price" htmlFor="p-price" error={errors.basePrice?.message} hint="Default for new variants">
          <Input id="p-price" inputMode="decimal" placeholder="0.00" leftElement={<span className="text-xs">₹</span>} {...form.register("basePrice")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status" error={errors.status?.message}>
          <Controller control={form.control} name="status" render={({ field }) => <Select options={PRODUCT_STATUS_OPTIONS} value={field.value} onValueChange={field.onChange} />} />
        </Field>
        <Field label="Category">
          <Controller control={form.control} name="categoryId" render={({ field }) => <Select options={categoryOptions} value={field.value} onValueChange={field.onChange} />} />
        </Field>
      </div>
      <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
        <p className="text-sm font-medium sm:col-span-2">GST</p>
        <Field label="HSN / SAC code" htmlFor="p-hsn" error={errors.hsnCode?.message} hint="Printed on tax invoices">
          <Input id="p-hsn" inputMode="numeric" maxLength={8} placeholder="e.g. 6109" {...form.register("hsnCode")} />
        </Field>
        <Field label="GST rate" htmlFor="p-gst">
          <Controller control={form.control} name="gstRate" render={({ field }) => <Select id="p-gst" options={RATE_OPTIONS} value={field.value} onValueChange={field.onChange} />} />
        </Field>
        <Field label="Taxability">
          <Controller
            control={form.control}
            name="gstTaxability"
            render={({ field }) => <Select options={TAXABILITY_OPTIONS.map((t) => ({ value: t.value, label: t.label }))} value={field.value} onValueChange={(v) => field.onChange(v as Values["gstTaxability"])} />}
          />
        </Field>
        <Field label="Unit">
          <Controller control={form.control} name="unit" render={({ field }) => <Select options={UNIT_OPTIONS} value={field.value} onValueChange={field.onChange} placeholder="pcs" />} />
        </Field>
      </div>
      <Field label="Description" htmlFor="p-desc" error={errors.description?.message}>
        <Textarea id="p-desc" rows={4} placeholder="What makes this product great?" {...form.register("description")} />
      </Field>
    </FormDialog>
  );
}
