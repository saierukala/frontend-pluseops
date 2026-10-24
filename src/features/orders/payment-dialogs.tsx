"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FormDialog, Field } from "@/components/app/form-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { paymentsApi, type Payment } from "@/lib/api/modules/payments";
import type { Order } from "@/lib/api/modules/orders";
import { formatMoney } from "@/lib/format";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";

function useInvalidatePayments(orderId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["payments"] });
    queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

const PROVIDERS = [
  { value: "manual", label: "Manual / offline (cash, bank transfer)" },
  { value: "stripe", label: "Card (Stripe)" },
  { value: "paypal", label: "PayPal" },
];

/**
 * Records a payment for an order: creates it (amount derived by the server from the order total)
 * and confirms it in one step. A pending payment from an earlier attempt is confirmed instead.
 */
export function RecordPaymentDialog({ open, onOpenChange, order, pending }: { open: boolean; onOpenChange: (o: boolean) => void; order: Order; pending?: Payment }) {
  const invalidate = useInvalidatePayments(order.id);
  const [provider, setProvider] = React.useState("manual");

  const record = useMutation({
    mutationFn: async () => {
      const payment = pending ?? (await paymentsApi.create({ orderId: order.id, provider }));
      return paymentsApi.confirm({ paymentId: payment.id });
    },
    onSuccess: (p) => {
      if (p.status === "COMPLETED") toast.success("Payment recorded", { description: formatMoney(p.amount, p.currency) });
      else toast.error("Payment failed", { description: "The provider declined the payment. You can try again." });
      invalidate();
      onOpenChange(false);
    },
    onError: (e) => {
      toastError(e, "Couldn't record payment");
      invalidate();
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={pending ? "Confirm pending payment" : "Record payment"}
      description="The amount is taken from the order total on the server."
      submitLabel={`Charge ${formatMoney(pending?.amount ?? order.total, order.currency)}`}
      pending={record.isPending}
      onSubmit={(e) => {
        e.preventDefault();
        record.mutate();
      }}
    >
      <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
        <span className="text-sm text-muted-foreground">Amount due</span>
        <span className="tabular text-lg font-semibold">{formatMoney(pending?.amount ?? order.total, order.currency)}</span>
      </div>
      {pending ? null : (
        <Field label="Method">
          <Select options={PROVIDERS} value={provider} onValueChange={setProvider} />
        </Field>
      )}
    </FormDialog>
  );
}

const refundSchema = z.object({
  amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Use an amount like 10 or 10.50"),
  reason: z.string().trim().max(500).optional(),
});
type RefundValues = z.infer<typeof refundSchema>;

export function RefundDialog({ open, onOpenChange, payment, refundable }: { open: boolean; onOpenChange: (o: boolean) => void; payment: Payment; refundable: string }) {
  const invalidate = useInvalidatePayments(payment.orderId);
  const form = useForm<RefundValues>({ resolver: zodResolver(refundSchema), values: { amount: refundable, reason: "" } });

  const refund = useMutation({
    mutationFn: (v: RefundValues) => paymentsApi.refund(payment.id, { amount: v.amount, reason: v.reason || undefined }),
    onSuccess: (_, v) => {
      toast.success("Refund issued", { description: formatMoney(v.amount, payment.currency) });
      invalidate();
      onOpenChange(false);
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, ["amount", "reason"])) toastError(e, "Couldn't issue refund");
    },
  });
  const { errors } = form.formState;

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Issue refund" description={`Up to ${formatMoney(refundable, payment.currency)} can still be refunded on this payment.`} submitLabel="Refund" pending={refund.isPending} onSubmit={form.handleSubmit((v) => refund.mutate(v))}>
      <Field label="Amount" htmlFor="rf-amount" error={errors.amount?.message}>
        <Input id="rf-amount" inputMode="decimal" className="tabular" leftElement={<span className="text-xs">$</span>} {...form.register("amount")} />
      </Field>
      <Field label="Reason" htmlFor="rf-reason">
        <Controller control={form.control} name="reason" render={({ field }) => <Input id="rf-reason" placeholder="Damaged item, customer request…" {...field} />} />
      </Field>
    </FormDialog>
  );
}
