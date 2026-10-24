"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Globe2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/app/form-dialog";
import { ComboboxField } from "@/components/app/combobox-field";
import { workspaceApi, type WorkspaceSettings } from "@/lib/api/modules/tenants";
import { usePermission } from "@/lib/auth/permission-context";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";

function supported(kind: "timeZone" | "currency"): string[] {
  try {
    return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf(kind);
  } catch {
    return [];
  }
}

// Browsers list some zones under their pre-rename ICU ids (Asia/Calcutta); show and save the current IANA names
const RENAMED_ZONES: Record<string, string> = {
  "Asia/Calcutta": "Asia/Kolkata",
  "Asia/Saigon": "Asia/Ho_Chi_Minh",
  "Asia/Katmandu": "Asia/Kathmandu",
  "Asia/Rangoon": "Asia/Yangon",
  "Europe/Kiev": "Europe/Kyiv",
  "America/Buenos_Aires": "America/Argentina/Buenos_Aires",
  "Atlantic/Faeroe": "Atlantic/Faroe",
  "Pacific/Truk": "Pacific/Chuuk",
  "Pacific/Ponape": "Pacific/Pohnpei",
};

function timeZoneOptions(current: string) {
  const zones = new Set(supported("timeZone").map((z) => RENAMED_ZONES[z] ?? z));
  if (current) zones.add(current);
  return [...zones].sort().map((z) => ({ value: z, label: z.replace(/_/g, " ") }));
}

const schema = z.object({
  currency: z.string(),
  timezone: z.string(),
  locale: z.string().trim().max(35),
  contactEmail: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]),
  contactPhone: z.string().trim().max(30),
});
type Values = z.infer<typeof schema>;

const toForm = (s?: WorkspaceSettings): Values => ({
  currency: s?.currency ?? "",
  timezone: s?.timezone ?? "",
  locale: s?.locale ?? "",
  contactEmail: s?.contactEmail ?? "",
  contactPhone: s?.contactPhone ?? "",
});

/** Currency, time zone, locale and public contact details (GET/PATCH /workspace/settings). */
export function WorkspaceSettingsCard() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canEdit = hasPermission("tenant:update");
  const settings = useQuery({ queryKey: ["workspace", "settings"], queryFn: () => workspaceApi.getSettings() });
  const form = useForm<Values>({ resolver: zodResolver(schema), values: toForm(settings.data) });

  const currencies = React.useMemo(() => supported("currency").map((c) => ({ value: c, label: c })), []);
  const savedZone = settings.data?.timezone ?? "";
  const zones = React.useMemo(() => timeZoneOptions(savedZone), [savedZone]);

  const save = useMutation({
    // Only changed fields are sent; clearing a field sends null
    mutationFn: (v: Values) => {
      const dirty = form.formState.dirtyFields;
      const body = Object.fromEntries(
        (Object.keys(v) as Array<keyof Values>).filter((k) => dirty[k]).map((k) => [k, v[k].trim() === "" ? null : v[k].trim()])
      ) as Partial<WorkspaceSettings>;
      return workspaceApi.updateSettings(body);
    },
    onSuccess: (saved) => {
      toast.success("Workspace settings saved");
      queryClient.setQueryData(["workspace", "settings"], saved);
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
      form.reset(toForm(saved));
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, Object.keys(schema.shape))) toastError(e, "Couldn't save settings");
    },
  });
  const { errors, isDirty } = form.formState;

  return (
    <Card>
      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} noValidate>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe2 className="size-4" /> Regional & contact
          </CardTitle>
          <CardDescription>Defaults for money, dates and the contact details shown to shoppers.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          {settings.isLoading ? (
            <Skeleton className="h-32 w-full sm:col-span-2" />
          ) : (
            <>
              <Field label="Currency" error={errors.currency?.message}>
                <Controller
                  control={form.control}
                  name="currency"
                  render={({ field }) =>
                    currencies.length ? (
                      <ComboboxField value={field.value} onChange={(v) => form.setValue("currency", v, { shouldDirty: true })} options={currencies} placeholder="Not set" searchPlaceholder="Search currency (USD, INR…)" />
                    ) : (
                      <Input {...field} maxLength={3} placeholder="USD" disabled={!canEdit} />
                    )
                  }
                />
              </Field>
              <Field label="Time zone" error={errors.timezone?.message}>
                <Controller
                  control={form.control}
                  name="timezone"
                  render={({ field }) =>
                    zones.length ? (
                      <ComboboxField value={field.value} onChange={(v) => form.setValue("timezone", v, { shouldDirty: true })} options={zones} placeholder="Not set" searchPlaceholder="Search city (Kolkata, London…)" />
                    ) : (
                      <Input {...field} placeholder="Asia/Kolkata" disabled={!canEdit} />
                    )
                  }
                />
              </Field>
              <Field label="Locale" htmlFor="ws-locale" error={errors.locale?.message} hint="BCP 47 tag, e.g. en-US or en-IN">
                <Input id="ws-locale" placeholder="en-US" disabled={!canEdit} {...form.register("locale")} />
              </Field>
              <Field label="Contact email" htmlFor="ws-email" error={errors.contactEmail?.message}>
                <Input id="ws-email" type="email" placeholder="support@yourstore.com" disabled={!canEdit} {...form.register("contactEmail")} />
              </Field>
              <Field label="Contact phone" htmlFor="ws-phone" error={errors.contactPhone?.message}>
                <Input id="ws-phone" type="tel" disabled={!canEdit} {...form.register("contactPhone")} />
              </Field>
            </>
          )}
        </CardContent>
        {canEdit ? (
          <CardFooter className="justify-end gap-2 border-t pt-6">
            <Button type="button" variant="ghost" disabled={!isDirty || save.isPending} onClick={() => form.reset(toForm(settings.data))}>
              Discard
            </Button>
            <Button type="submit" loading={save.isPending} disabled={!isDirty}>
              Save settings
            </Button>
          </CardFooter>
        ) : null}
      </form>
    </Card>
  );
}
