"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { FormDialog, Field } from "@/components/app/form-dialog";
import { cashRegistersApi, type CashSession } from "@/lib/api/modules/pos";
import { formatMoney } from "@/lib/format";
import { toastError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

const MONEY = /^\d+(\.\d{1,2})?$/;

function useRefresh() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
    queryClient.invalidateQueries({ queryKey: ["pos", "context"] });
  };
}

export function OpenRegisterDialog({ open, onOpenChange, registerId, registerName }: { open: boolean; onOpenChange: (o: boolean) => void; registerId: string; registerName: string }) {
  const refresh = useRefresh();
  const [float, setFloat] = React.useState("");
  const valid = float === "" || MONEY.test(float);
  const save = useMutation({
    mutationFn: () => cashRegistersApi.open(registerId, float || "0"),
    onSuccess: () => {
      toast.success(`${registerName} is open`, { description: `Float ${formatMoney(float || "0")}` });
      refresh();
      onOpenChange(false);
      setFloat("");
    },
    onError: (e) => toastError(e, "Couldn't open the register"),
  });
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={`Open ${registerName}`} description="Count the cash in the drawer before the first sale." submitLabel="Open register" pending={save.isPending} onSubmit={(e) => { e.preventDefault(); if (valid) save.mutate(); }}>
      <Field label="Opening float" htmlFor="reg-float" error={valid ? undefined : "An amount like 2000 or 1500.50"}>
        <Input id="reg-float" autoFocus inputMode="decimal" placeholder="0.00" leftElement={<span className="text-xs">₹</span>} value={float} onChange={(e) => setFloat(e.target.value)} />
      </Field>
    </FormDialog>
  );
}

export function CashMoveDialog({ open, onOpenChange, session }: { open: boolean; onOpenChange: (o: boolean) => void; session: CashSession }) {
  const refresh = useRefresh();
  const [type, setType] = React.useState<"CASH_IN" | "CASH_OUT">("CASH_IN");
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");
  const valid = MONEY.test(amount) && Number(amount) > 0 && reason.trim() !== "";
  const save = useMutation({
    mutationFn: () => cashRegistersApi.move(session.id, { type, amount, reason: reason.trim() }),
    onSuccess: () => {
      toast.success(type === "CASH_IN" ? "Cash added" : "Cash taken out", { description: formatMoney(amount) });
      refresh();
      onOpenChange(false);
      setAmount("");
      setReason("");
    },
    onError: (e) => toastError(e, "Couldn't record the cash"),
  });
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Cash in / out" description={`In the drawer now: ${formatMoney(session.totals.expectedCash)}`} submitLabel="Record" pending={save.isPending} onSubmit={(e) => { e.preventDefault(); if (valid) save.mutate(); }}>
      <div role="radiogroup" aria-label="Direction" className="grid grid-cols-2 gap-2">
        {(["CASH_IN", "CASH_OUT"] as const).map((t) => (
          <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setType(t)} className={cn("rounded-lg border p-3 text-sm font-medium", type === t ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-foreground/25")}>
            {t === "CASH_IN" ? "Cash in" : "Cash out"}
          </button>
        ))}
      </div>
      <Field label="Amount" htmlFor="mv-amount">
        <Input id="mv-amount" autoFocus inputMode="decimal" leftElement={<span className="text-xs">₹</span>} value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <Field label="Reason" htmlFor="mv-reason" hint={type === "CASH_IN" ? "e.g. change top-up" : "e.g. bank deposit, tea and snacks"}>
        <Input id="mv-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </FormDialog>
  );
}

export function CloseRegisterDialog({ open, onOpenChange, session }: { open: boolean; onOpenChange: (o: boolean) => void; session: CashSession }) {
  const refresh = useRefresh();
  const [counted, setCounted] = React.useState("");
  const [note, setNote] = React.useState("");
  const valid = MONEY.test(counted);
  const variance = valid ? Number(counted) - Number(session.totals.expectedCash) : null;
  const save = useMutation({
    mutationFn: () => cashRegistersApi.close(session.id, counted, note.trim() || undefined),
    onSuccess: (closed) => {
      const v = Number(closed.variance ?? 0);
      toast.success(`${closed.registerName ?? "Register"} closed`, { description: v === 0 ? "Cash matches." : `${v > 0 ? "Over" : "Short"} by ${formatMoney(Math.abs(v).toFixed(2))}` });
      refresh();
      onOpenChange(false);
      setCounted("");
      setNote("");
    },
    onError: (e) => toastError(e, "Couldn't close the register"),
  });
  const t = session.totals;
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={`Close ${session.registerName ?? "register"}`} description="Count the cash in the drawer and enter the total." submitLabel="Close register" pending={save.isPending} onSubmit={(e) => { e.preventDefault(); if (valid) save.mutate(); }}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg border bg-muted/30 p-4 text-sm">
        <dt className="text-muted-foreground">Opening float</dt>
        <dd className="tabular text-right">{formatMoney(t.openingFloat)}</dd>
        <dt className="text-muted-foreground">Cash sales</dt>
        <dd className="tabular text-right">+{formatMoney(t.cashSales)}</dd>
        {Number(t.cashRefunds) ? (
          <>
            <dt className="text-muted-foreground">Cash refunds</dt>
            <dd className="tabular text-right">−{formatMoney(t.cashRefunds)}</dd>
          </>
        ) : null}
        <dt className="text-muted-foreground">Cash in</dt>
        <dd className="tabular text-right">+{formatMoney(t.cashIn)}</dd>
        <dt className="text-muted-foreground">Cash out</dt>
        <dd className="tabular text-right">−{formatMoney(t.cashOut)}</dd>
        <dt className="border-t pt-1 font-semibold">Expected in drawer</dt>
        <dd className="tabular border-t pt-1 text-right font-semibold">{formatMoney(t.expectedCash)}</dd>
      </dl>
      <Field label="Counted cash" htmlFor="close-counted">
        <Input id="close-counted" autoFocus inputMode="decimal" leftElement={<span className="text-xs">₹</span>} value={counted} onChange={(e) => setCounted(e.target.value)} />
      </Field>
      {variance !== null ? (
        <p className={cn("text-sm font-medium", variance === 0 ? "text-success" : "text-destructive")} role="status">
          {variance === 0 ? "Cash matches the expected amount." : `${variance > 0 ? "Over" : "Short"} by ${formatMoney(Math.abs(variance).toFixed(2))}`}
        </p>
      ) : null}
      <Field label="Note (optional)" htmlFor="close-note">
        <Input id="close-note" value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
    </FormDialog>
  );
}
