"use client";

import * as React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Mail, Phone, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormDialog, Field } from "@/components/app/form-dialog";
import { customersApi, type Customer, type CustomerType } from "@/lib/api/modules/customers";
import { fullName } from "@/lib/format";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";
import { STATE_OPTIONS, isValidGstin, isValidPan } from "@/lib/gst";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    customerType: z.enum(["CONSUMER", "BUSINESS"]),
    firstName: z.string().trim().min(1, "First name is required").max(100),
    lastName: z.string().trim().min(1, "Last name is required").max(100),
    email: z.string().trim().email("Enter a valid email").max(255),
    phone: z.string().trim().max(50).optional(),
    companyName: z.string().trim().max(255),
    gstin: z.string().trim().refine((v) => v === "" || isValidGstin(v), "Not a valid GSTIN — check the 15 characters"),
    pan: z.string().trim().refine((v) => v === "" || isValidPan(v), "PAN looks like ABCDE1234F"),
    stateCode: z.string(),
  })
  .refine((v) => v.customerType !== "BUSINESS" || v.companyName !== "", { message: "Company name is required for a business", path: ["companyName"] })
  .refine((v) => !v.gstin || !v.stateCode || v.gstin.toUpperCase().slice(0, 2) === v.stateCode, { message: "This GSTIN is registered in a different state", path: ["gstin"] });
type Values = z.infer<typeof schema>;

const TYPES: Array<{ value: CustomerType; label: string; hint: string; icon: typeof User }> = [
  { value: "CONSUMER", label: "Consumer", hint: "A person; name is enough", icon: User },
  { value: "BUSINESS", label: "Business", hint: "GSTIN goes on the invoice", icon: Building2 },
];

export function CustomerDialog({ open, onOpenChange, customer, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; customer?: Customer; onSaved?: (c: Customer) => void }) {
  const queryClient = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      customerType: customer?.customerType ?? "CONSUMER",
      firstName: customer?.firstName ?? "",
      lastName: customer?.lastName ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      companyName: customer?.companyName ?? "",
      gstin: customer?.gstin ?? "",
      pan: customer?.pan ?? "",
      stateCode: customer?.stateCode ?? "",
    },
  });
  const type = useWatch({ control: form.control, name: "customerType" });
  const business = type === "BUSINESS";

  const save = useMutation({
    mutationFn: (v: Values) => {
      // Empty optional fields: left out when adding, cleared (null) when editing
      const empty = customer ? null : undefined;
      const tax = {
        customerType: v.customerType,
        companyName: business ? v.companyName : empty,
        gstin: business && v.gstin ? v.gstin.toUpperCase() : empty,
        pan: business && v.pan ? v.pan.toUpperCase() : business && v.gstin ? undefined : empty,
        stateCode: v.stateCode || (business && v.gstin ? undefined : empty),
      };
      const person = { firstName: v.firstName, lastName: v.lastName, email: v.email };
      return customer
        ? customersApi.update(customer.id, { ...person, ...tax, phone: v.phone || null })
        : customersApi.create({ ...person, ...tax, phone: v.phone || undefined });
    },
    onSuccess: (c) => {
      toast.success(customer ? "Customer updated" : "Customer added", { description: c.companyName || fullName(c) });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", c.id] });
      onOpenChange(false);
      form.reset();
      onSaved?.(c);
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, ["customerType", "firstName", "lastName", "email", "phone", "companyName", "gstin", "pan", "stateCode"])) toastError(e, "Couldn't save customer");
    },
  });
  const { errors } = form.formState;

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={customer ? "Edit customer" : "New customer"} submitLabel={customer ? "Save changes" : "Add customer"} pending={save.isPending} onSubmit={form.handleSubmit((v) => save.mutate(v))}>
      <div role="radiogroup" aria-label="Customer type" className="grid grid-cols-2 gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={type === t.value}
            onClick={() => form.setValue("customerType", t.value, { shouldDirty: true })}
            className={cn("flex items-start gap-3 rounded-lg border p-3 text-left transition-colors", type === t.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-foreground/25")}
          >
            <t.icon className="mt-0.5 size-4 text-muted-foreground" />
            <span>
              <span className="block text-sm font-medium">{t.label}</span>
              <span className="block text-xs text-muted-foreground">{t.hint}</span>
            </span>
          </button>
        ))}
      </div>
      {business ? (
        <Field label="Company name" htmlFor="cu-company" error={errors.companyName?.message}>
          <Input id="cu-company" placeholder="Ravi Traders Pvt Ltd" {...form.register("companyName")} />
        </Field>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={business ? "Contact first name" : "First name"} htmlFor="cu-first" error={errors.firstName?.message}>
          <Input id="cu-first" autoFocus {...form.register("firstName")} />
        </Field>
        <Field label={business ? "Contact last name" : "Last name"} htmlFor="cu-last" error={errors.lastName?.message}>
          <Input id="cu-last" {...form.register("lastName")} />
        </Field>
      </div>
      <Field label="Email" htmlFor="cu-email" error={errors.email?.message}>
        <Input id="cu-email" type="email" leftElement={<Mail className="size-4" />} {...form.register("email")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" htmlFor="cu-phone" error={errors.phone?.message}>
          <Input id="cu-phone" type="tel" placeholder="Optional" leftElement={<Phone className="size-4" />} {...form.register("phone")} />
        </Field>
        <Field label="State" htmlFor="cu-state" hint={business ? "From the GSTIN if left blank" : "Decides CGST+SGST or IGST"}>
          <Controller control={form.control} name="stateCode" render={({ field }) => <Select id="cu-state" value={field.value} onValueChange={field.onChange} options={STATE_OPTIONS} placeholder="Optional" />} />
        </Field>
      </div>
      {business ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="GSTIN" htmlFor="cu-gstin" error={errors.gstin?.message}>
            <Input id="cu-gstin" className="font-mono uppercase" maxLength={15} placeholder="27ABCDE1234F1Z5" {...form.register("gstin")} />
          </Field>
          <Field label="PAN" htmlFor="cu-pan" error={errors.pan?.message} hint="From the GSTIN if left blank">
            <Input id="cu-pan" className="font-mono uppercase" maxLength={10} {...form.register("pan")} />
          </Field>
        </div>
      ) : null}
    </FormDialog>
  );
}
