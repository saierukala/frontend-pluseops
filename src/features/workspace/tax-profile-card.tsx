"use client";

import * as React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Landmark } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/app/form-dialog";
import { workspaceApi, type TaxProfile } from "@/lib/api/modules/tenants";
import { usePermission } from "@/lib/auth/permission-context";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";
import { STATE_OPTIONS, isValidGstin, isValidPan, stateName } from "@/lib/gst";

const optional = (check: (v: string) => boolean, message: string) => z.string().trim().refine((v) => v === "" || check(v), message);

const schema = z
  .object({
    legalName: z.string().trim().max(255),
    tradeName: z.string().trim().max(255),
    registrationType: z.enum(["REGULAR", "COMPOSITION", "UNREGISTERED", ""]),
    gstin: optional(isValidGstin, "Not a valid GSTIN — check the 15 characters"),
    pan: optional(isValidPan, "PAN looks like ABCDE1234F"),
    stateCode: z.string(),
    line1: z.string().trim().max(255),
    line2: z.string().trim().max(255),
    city: z.string().trim().max(100),
    pincode: optional((v) => /^[1-9][0-9]{5}$/.test(v), "6-digit PIN code"),
    phone: z.string().trim().max(30),
    email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]),
    bankName: z.string().trim().max(100),
    accountNumber: optional((v) => /^[0-9]{6,20}$/.test(v), "6–20 digits"),
    ifsc: optional((v) => /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(v), "IFSC looks like HDFC0001234"),
    upiId: optional((v) => /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(v), "UPI ID looks like shop@okhdfcbank"),
    signatory: z.string().trim().max(100),
    invoicePrefix: optional((v) => /^[A-Z0-9-]{1,10}$/i.test(v), "Up to 10 letters, numbers or -"),
    invoiceTerms: z.string().trim().max(1000),
    pricesIncludeTax: z.boolean(),
  })
  .refine((v) => !v.gstin || !v.stateCode || v.gstin.toUpperCase().slice(0, 2) === v.stateCode, { message: "This GSTIN is registered in a different state", path: ["gstin"] })
  .refine((v) => [v.line1, v.city, v.pincode].every(Boolean) || ![v.line1, v.line2, v.city, v.pincode].some(Boolean), { message: "Fill street, city and PIN code together", path: ["line1"] });
type Values = z.infer<typeof schema>;

const toForm = (p?: TaxProfile): Values => ({
  legalName: p?.legalName ?? "",
  tradeName: p?.tradeName ?? "",
  registrationType: p?.registrationType ?? "",
  gstin: p?.gstin ?? "",
  pan: p?.pan ?? "",
  stateCode: p?.stateCode ?? "",
  line1: p?.address?.line1 ?? "",
  line2: p?.address?.line2 ?? "",
  city: p?.address?.city ?? "",
  pincode: p?.address?.pincode ?? "",
  phone: p?.phone ?? "",
  email: p?.email ?? "",
  bankName: p?.bankName ?? "",
  accountNumber: p?.accountNumber ?? "",
  ifsc: p?.ifsc ?? "",
  upiId: p?.upiId ?? "",
  signatory: p?.signatory ?? "",
  invoicePrefix: p?.invoicePrefix ?? "",
  invoiceTerms: p?.invoiceTerms ?? "",
  pricesIncludeTax: Boolean(p?.pricesIncludeTax),
});

const TEXT_KEYS = ["legalName", "tradeName", "gstin", "pan", "phone", "email", "bankName", "accountNumber", "ifsc", "upiId", "signatory", "invoicePrefix", "invoiceTerms"] as const;
const UPPER = new Set(["gstin", "pan", "ifsc", "invoicePrefix"]);

/** The business's GST identity, printed on every tax invoice (GET/PATCH /workspace/tax-profile). */
export function TaxProfileCard() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canEdit = hasPermission("tenant:update");
  const profile = useQuery({ queryKey: ["workspace", "tax-profile"], queryFn: () => workspaceApi.getTaxProfile() });
  const form = useForm<Values>({ resolver: zodResolver(schema), values: toForm(profile.data) });
  const { errors, isDirty } = form.formState;

  const save = useMutation({
    mutationFn: (v: Values) => {
      const body: Record<string, unknown> = {};
      for (const key of TEXT_KEYS) {
        const value = v[key].trim();
        body[key] = value === "" ? null : UPPER.has(key) ? value.toUpperCase() : value;
      }
      body.registrationType = v.registrationType || null;
      body.stateCode = v.stateCode || null;
      body.address = v.line1 ? { line1: v.line1, line2: v.line2 || null, city: v.city, pincode: v.pincode } : null;
      body.pricesIncludeTax = v.pricesIncludeTax;
      // The GSTIN fills in state and PAN on the server when they're left blank
      if (body.gstin) {
        if (!body.stateCode) delete body.stateCode;
        if (!body.pan) delete body.pan;
      }
      return workspaceApi.updateTaxProfile(body);
    },
    onSuccess: (saved) => {
      toast.success("Tax profile saved", { description: "New invoices use these details." });
      queryClient.setQueryData(["workspace", "tax-profile"], saved);
      form.reset(toForm(saved));
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, Object.keys(toForm()))) toastError(e, "Couldn't save the tax profile");
    },
  });

  const registration = useWatch({ control: form.control, name: "registrationType" });
  const state = useWatch({ control: form.control, name: "stateCode" });

  return (
    <Card>
      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} noValidate>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="size-4" /> GST & invoice details
          </CardTitle>
          <CardDescription>Printed on every tax invoice. Sales inside your state get CGST + SGST, other states IGST.</CardDescription>
        </CardHeader>
        {profile.isLoading ? (
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        ) : (
          <fieldset disabled={!canEdit} className="contents">
            <CardContent className="flex flex-col gap-6 pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Legal name" htmlFor="tp-legal" hint="As on your GST certificate" error={errors.legalName?.message}>
                  <Input id="tp-legal" {...form.register("legalName")} />
                </Field>
                <Field label="Trade name" htmlFor="tp-trade" hint="Shop name, if different" error={errors.tradeName?.message}>
                  <Input id="tp-trade" {...form.register("tradeName")} />
                </Field>
                <Field label="GST registration" htmlFor="tp-reg" hint={registration === "COMPOSITION" || registration === "UNREGISTERED" ? "No GST is charged: bills are issued as a bill of supply" : undefined}>
                  <Controller
                    control={form.control}
                    name="registrationType"
                    render={({ field }) => (
                      <Select
                        id="tp-reg"
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Regular"
                        options={[
                          { value: "REGULAR", label: "Regular (charges GST)" },
                          { value: "COMPOSITION", label: "Composition scheme" },
                          { value: "UNREGISTERED", label: "Not registered" },
                        ]}
                      />
                    )}
                  />
                </Field>
                <Field label="GSTIN" htmlFor="tp-gstin" hint="Fills in your state and PAN" error={errors.gstin?.message}>
                  <Input id="tp-gstin" className="font-mono uppercase" maxLength={15} placeholder="29ABCDE1234F1Z5" {...form.register("gstin")} />
                </Field>
                <Field label="State" htmlFor="tp-state" hint={state ? `GST state code ${state}` : "Where your business is registered"}>
                  <Controller control={form.control} name="stateCode" render={({ field }) => <Select id="tp-state" value={field.value} onValueChange={field.onChange} options={STATE_OPTIONS} placeholder="From GSTIN" />} />
                </Field>
                <Field label="PAN" htmlFor="tp-pan" error={errors.pan?.message}>
                  <Input id="tp-pan" className="font-mono uppercase" maxLength={10} placeholder="From GSTIN" {...form.register("pan")} />
                </Field>
              </div>

              <div className="grid gap-4 border-t pt-6 sm:grid-cols-2">
                <Field label="Street address" htmlFor="tp-line1" error={errors.line1?.message} className="sm:col-span-2">
                  <Input id="tp-line1" {...form.register("line1")} />
                </Field>
                <Field label="Area / landmark (optional)" htmlFor="tp-line2">
                  <Input id="tp-line2" {...form.register("line2")} />
                </Field>
                <Field label="City" htmlFor="tp-city">
                  <Input id="tp-city" {...form.register("city")} />
                </Field>
                <Field label="PIN code" htmlFor="tp-pin" error={errors.pincode?.message}>
                  <Input id="tp-pin" inputMode="numeric" maxLength={6} {...form.register("pincode")} />
                </Field>
                <Field label="Phone" htmlFor="tp-phone">
                  <Input id="tp-phone" type="tel" {...form.register("phone")} />
                </Field>
                <Field label="Email on invoices" htmlFor="tp-email" error={errors.email?.message}>
                  <Input id="tp-email" type="email" {...form.register("email")} />
                </Field>
              </div>

              <div className="grid gap-4 border-t pt-6 sm:grid-cols-2">
                <Field label="Bank name" htmlFor="tp-bank">
                  <Input id="tp-bank" {...form.register("bankName")} />
                </Field>
                <Field label="Account number" htmlFor="tp-acct" error={errors.accountNumber?.message}>
                  <Input id="tp-acct" inputMode="numeric" {...form.register("accountNumber")} />
                </Field>
                <Field label="IFSC" htmlFor="tp-ifsc" error={errors.ifsc?.message}>
                  <Input id="tp-ifsc" className="font-mono uppercase" maxLength={11} {...form.register("ifsc")} />
                </Field>
                <Field label="UPI ID" htmlFor="tp-upi" error={errors.upiId?.message} hint="Printed with a QR code on invoices">
                  <Input id="tp-upi" placeholder="shop@okhdfcbank" {...form.register("upiId")} />
                </Field>
              </div>

              <div className="grid gap-4 border-t pt-6 sm:grid-cols-2">
                <Field label="Invoice prefix" htmlFor="tp-prefix" error={errors.invoicePrefix?.message} hint="Invoices are numbered PREFIX/2026-27/0001">
                  <Input id="tp-prefix" className="font-mono uppercase" maxLength={10} {...form.register("invoicePrefix")} />
                </Field>
                <Field label="Authorised signatory" htmlFor="tp-sign">
                  <Input id="tp-sign" {...form.register("signatory")} />
                </Field>
                <Field label="Terms printed on invoices" htmlFor="tp-terms" className="sm:col-span-2">
                  <Textarea id="tp-terms" rows={3} placeholder="Goods once sold will not be taken back…" {...form.register("invoiceTerms")} />
                </Field>
                <label className="flex items-start justify-between gap-4 rounded-lg border p-4 sm:col-span-2">
                  <span>
                    <span className="block text-sm font-medium">Prices include GST</span>
                    <span className="block text-sm text-muted-foreground">On: a ₹118 price with 18% GST bills ₹100 + ₹18. Off: GST is added on top of the price.</span>
                  </span>
                  <Controller control={form.control} name="pricesIncludeTax" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Prices include GST" />} />
                </label>
              </div>
              {profile.data?.stateCode ? (
                <p className="text-xs text-muted-foreground">
                  Registered in {stateName(profile.data.stateCode)}: buyers there pay CGST + SGST, buyers elsewhere pay IGST.
                </p>
              ) : null}
            </CardContent>
            {canEdit ? (
              <CardFooter className="justify-end border-t">
                <Button type="submit" loading={save.isPending} disabled={!isDirty}>
                  Save GST details
                </Button>
              </CardFooter>
            ) : null}
          </fieldset>
        )}
      </form>
    </Card>
  );
}
