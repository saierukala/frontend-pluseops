"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormDialog, Field } from "@/components/app/form-dialog";
import { customersApi, type Customer } from "@/lib/api/modules/customers";
import { fullName } from "@/lib/format";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";

const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(50).optional(),
});
type Values = z.infer<typeof schema>;

export function CustomerDialog({ open, onOpenChange, customer, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; customer?: Customer; onSaved?: (c: Customer) => void }) {
  const queryClient = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: { firstName: customer?.firstName ?? "", lastName: customer?.lastName ?? "", email: customer?.email ?? "", phone: customer?.phone ?? "" },
  });
  const save = useMutation({
    mutationFn: (v: Values) => (customer ? customersApi.update(customer.id, { ...v, phone: v.phone || null }) : customersApi.create({ ...v, phone: v.phone || undefined })),
    onSuccess: (c) => {
      toast.success(customer ? "Customer updated" : "Customer added", { description: fullName(c) });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onOpenChange(false);
      form.reset();
      onSaved?.(c);
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, Object.keys(schema.shape))) toastError(e, "Couldn't save customer");
    },
  });
  const { errors } = form.formState;

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={customer ? "Edit customer" : "New customer"} submitLabel={customer ? "Save changes" : "Add customer"} pending={save.isPending} onSubmit={form.handleSubmit((v) => save.mutate(v))}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="cu-first" error={errors.firstName?.message}>
          <Input id="cu-first" autoFocus {...form.register("firstName")} />
        </Field>
        <Field label="Last name" htmlFor="cu-last" error={errors.lastName?.message}>
          <Input id="cu-last" {...form.register("lastName")} />
        </Field>
      </div>
      <Field label="Email" htmlFor="cu-email" error={errors.email?.message}>
        <Input id="cu-email" type="email" leftElement={<Mail className="size-4" />} {...form.register("email")} />
      </Field>
      <Field label="Phone" htmlFor="cu-phone" error={errors.phone?.message}>
        <Input id="cu-phone" type="tel" placeholder="Optional" leftElement={<Phone className="size-4" />} {...form.register("phone")} />
      </Field>
    </FormDialog>
  );
}
