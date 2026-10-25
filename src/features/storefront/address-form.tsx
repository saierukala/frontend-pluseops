"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/app/form-dialog";
import type { ShopAddress, ShopAddressBody } from "@/lib/storefront/api";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";
import { useShop } from "./shop-context";

const optional = (max: number) => z.string().trim().max(max);
const schema = z.object({
  firstName: optional(100),
  lastName: optional(100),
  line1: z.string().trim().min(1, "Street address is required").max(255),
  line2: optional(255),
  city: z.string().trim().min(1, "City is required").max(100),
  state: optional(100),
  postalCode: optional(20),
  country: z.string().trim().regex(/^[A-Za-z]{2}$/, "Two-letter code, e.g. IN or US"),
  phone: optional(30),
});
type Values = z.infer<typeof schema>;

export function formatShopAddress(a: Pick<ShopAddress, "line1" | "line2" | "city" | "state" | "postalCode" | "country">) {
  return [a.line1, a.line2, a.city, [a.state, a.postalCode].filter(Boolean).join(" "), a.country].filter(Boolean).join(", ");
}

/** Inline address form used at checkout and in the account page. */
export function ShopAddressForm({
  type = "SHIPPING",
  address,
  onSaved,
  onCancel,
}: {
  type?: ShopAddress["type"];
  address?: ShopAddress;
  onSaved: (a: ShopAddress) => void;
  onCancel?: () => void;
}) {
  const { client, slug, shopper } = useShop();
  const queryClient = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: address?.firstName ?? shopper?.firstName ?? "",
      lastName: address?.lastName ?? shopper?.lastName ?? "",
      line1: address?.line1 ?? "",
      line2: address?.line2 ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      postalCode: address?.postalCode ?? "",
      country: address?.country ?? "",
      phone: address?.phone ?? shopper?.phone ?? "",
    },
  });
  const save = useMutation({
    mutationFn: (v: Values) => {
      const body = Object.fromEntries(Object.entries(v).map(([k, val]) => [k, val === "" ? null : val])) as unknown as ShopAddressBody;
      body.country = v.country.toUpperCase();
      return address ? client.updateAddress(address.id, body) : client.createAddress({ ...body, type, label: null, company: null });
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["shop", slug, "addresses"] });
      onSaved(saved);
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, Object.keys(schema.shape))) toastError(e, "Couldn't save address");
    },
  });
  const { errors } = form.formState;

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(e) => {
        // The checkout page nests this inside its own layout; keep the submit local
        e.stopPropagation();
        form.handleSubmit((v) => save.mutate(v))(e);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First name" htmlFor="sa-first">
          <Input id="sa-first" autoComplete="given-name" {...form.register("firstName")} />
        </Field>
        <Field label="Last name" htmlFor="sa-last">
          <Input id="sa-last" autoComplete="family-name" {...form.register("lastName")} />
        </Field>
      </div>
      <Field label="Street address" htmlFor="sa-line1" error={errors.line1?.message}>
        <Input id="sa-line1" autoComplete="address-line1" {...form.register("line1")} />
      </Field>
      <Field label="Apartment, suite, etc. (optional)" htmlFor="sa-line2">
        <Input id="sa-line2" autoComplete="address-line2" {...form.register("line2")} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="City" htmlFor="sa-city" error={errors.city?.message}>
          <Input id="sa-city" autoComplete="address-level2" {...form.register("city")} />
        </Field>
        <Field label="State" htmlFor="sa-state">
          <Input id="sa-state" autoComplete="address-level1" {...form.register("state")} />
        </Field>
        <Field label="Postal code" htmlFor="sa-zip">
          <Input id="sa-zip" autoComplete="postal-code" {...form.register("postalCode")} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Country code" htmlFor="sa-country" error={errors.country?.message}>
          <Input id="sa-country" maxLength={2} className="uppercase" autoComplete="country" placeholder="IN" {...form.register("country")} />
        </Field>
        <Field label="Phone (optional)" htmlFor="sa-phone">
          <Input id="sa-phone" type="tel" autoComplete="tel" {...form.register("phone")} />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={save.isPending}>
          {address ? "Save address" : "Use this address"}
        </Button>
      </div>
    </form>
  );
}
