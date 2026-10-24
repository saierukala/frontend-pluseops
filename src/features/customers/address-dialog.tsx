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
import { Switch } from "@/components/ui/switch";
import { customersApi, type AddressBody, type CustomerAddress } from "@/lib/api/modules/customers";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";

const optional = (max: number) => z.string().trim().max(max).optional();

const schema = z.object({
  type: z.enum(["SHIPPING", "BILLING"]),
  label: optional(100),
  firstName: optional(100),
  lastName: optional(100),
  company: optional(255),
  line1: z.string().trim().min(1, "Street address is required").max(255),
  line2: optional(255),
  city: z.string().trim().min(1, "City is required").max(100),
  state: optional(100),
  postalCode: optional(20),
  country: z.string().trim().regex(/^[A-Za-z]{2}$/, "Two-letter country code, e.g. US or IN"),
  phone: optional(30),
  isDefault: z.boolean(),
});
type Values = z.infer<typeof schema>;
const FIELDS = Object.keys(schema.shape);

/** "221B Baker St, London NW1, GB" — single line for lists and pickers. */
export function formatAddress(a: Pick<CustomerAddress, "line1" | "line2" | "city" | "state" | "postalCode" | "country">): string {
  return [a.line1, a.line2, a.city, [a.state, a.postalCode].filter(Boolean).join(" "), a.country].filter(Boolean).join(", ");
}

export function AddressDialog({
  open,
  onOpenChange,
  customerId,
  address,
  defaultType = "SHIPPING",
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  address?: CustomerAddress;
  defaultType?: CustomerAddress["type"];
  onSaved?: (address: CustomerAddress) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      type: address?.type ?? defaultType,
      label: address?.label ?? "",
      firstName: address?.firstName ?? "",
      lastName: address?.lastName ?? "",
      company: address?.company ?? "",
      line1: address?.line1 ?? "",
      line2: address?.line2 ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      postalCode: address?.postalCode ?? "",
      country: address?.country ?? "",
      phone: address?.phone ?? "",
      isDefault: address?.isDefault ?? false,
    },
  });

  const save = useMutation({
    mutationFn: (v: Values) => {
      // Empty optional fields are sent as null so editing can clear them
      const body = Object.fromEntries(Object.entries(v).map(([k, val]) => [k, val === "" ? null : val])) as unknown as AddressBody;
      body.country = v.country.toUpperCase();
      return address ? customersApi.updateAddress(customerId, address.id, body) : customersApi.createAddress(customerId, body);
    },
    onSuccess: (saved) => {
      toast.success(address ? "Address updated" : "Address added");
      queryClient.invalidateQueries({ queryKey: ["customer", customerId, "addresses"] });
      onOpenChange(false);
      onSaved?.(saved);
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, FIELDS)) toastError(e, "Couldn't save address");
    },
  });
  const { errors } = form.formState;

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={address ? "Edit address" : "New address"} submitLabel={address ? "Save address" : "Add address"} pending={save.isPending} onSubmit={form.handleSubmit((v) => save.mutate(v))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <Select
                options={[
                  { value: "SHIPPING", label: "Shipping" },
                  { value: "BILLING", label: "Billing" },
                ]}
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
        </Field>
        <Field label="Label" htmlFor="ad-label" hint="e.g. Home, Office">
          <Input id="ad-label" {...form.register("label")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="ad-first">
          <Input id="ad-first" {...form.register("firstName")} />
        </Field>
        <Field label="Last name" htmlFor="ad-last">
          <Input id="ad-last" {...form.register("lastName")} />
        </Field>
      </div>
      <Field label="Street address" htmlFor="ad-line1" error={errors.line1?.message}>
        <Input id="ad-line1" autoFocus {...form.register("line1")} />
      </Field>
      <Field label="Apartment, suite, etc." htmlFor="ad-line2">
        <Input id="ad-line2" {...form.register("line2")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" htmlFor="ad-city" error={errors.city?.message}>
          <Input id="ad-city" {...form.register("city")} />
        </Field>
        <Field label="State / region" htmlFor="ad-state">
          <Input id="ad-state" {...form.register("state")} />
        </Field>
        <Field label="Postal code" htmlFor="ad-zip">
          <Input id="ad-zip" {...form.register("postalCode")} />
        </Field>
        <Field label="Country" htmlFor="ad-country" error={errors.country?.message} hint="ISO code: US, IN, GB…">
          <Input id="ad-country" maxLength={2} className="uppercase" {...form.register("country")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company" htmlFor="ad-company">
          <Input id="ad-company" {...form.register("company")} />
        </Field>
        <Field label="Phone" htmlFor="ad-phone">
          <Input id="ad-phone" type="tel" {...form.register("phone")} />
        </Field>
      </div>
      <Controller control={form.control} name="isDefault" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} label="Default for this type" description="Pre-selected when creating orders." />} />
    </FormDialog>
  );
}
