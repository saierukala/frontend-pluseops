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

const NO_CATEGORY = "none";

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
});
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
      <Field label="Description" htmlFor="p-desc" error={errors.description?.message}>
        <Textarea id="p-desc" rows={4} placeholder="What makes this product great?" {...form.register("description")} />
      </Field>
    </FormDialog>
  );
}
