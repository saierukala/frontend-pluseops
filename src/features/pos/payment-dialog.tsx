"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Banknote, CheckCircle2, CreditCard, Landmark, Plus, QrCode, ScrollText, Trash2 } from "lucide-react";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { posApi, type PosContext, type PosPaymentMethod, type UpiQr } from "@/lib/api/modules/pos";
import { formatMoney } from "@/lib/format";
import { errorMessage } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

export interface Tender {
  method: PosPaymentMethod;
  amount: string;
  tendered?: string;
  reference?: string;
  razorpayQrId?: string;
  /** UPI only: confirmed paid (Razorpay) or confirmed by the cashier (shop UPI ID) */
  upiConfirmed?: boolean;
}

const METHODS: Array<{ method: PosPaymentMethod; label: string; icon: typeof Banknote; key: string }> = [
  { method: "CASH", label: "Cash", icon: Banknote, key: "1" },
  { method: "UPI", label: "UPI", icon: QrCode, key: "2" },
  { method: "CARD", label: "Card", icon: CreditCard, key: "3" },
  { method: "BANK", label: "Bank transfer", icon: Landmark, key: "4" },
  { method: "CHEQUE", label: "Cheque", icon: ScrollText, key: "5" },
];

const toPaise = (v?: string) => Math.round(Number(v || 0) * 100);
const fromPaise = (p: number) => (p / 100).toFixed(2);

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  ctx,
  cashOpen,
  pending,
  onPay,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  total: number;
  ctx: PosContext;
  cashOpen: boolean;
  pending: boolean;
  onPay: (tenders: Tender[]) => void;
}) {
  const totalPaise = Math.round(total * 100);
  const [tenders, setTenders] = React.useState<Tender[]>([{ method: "CASH", amount: fromPaise(totalPaise) }]);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the dialog opens for a new bill
    if (open) setTenders([{ method: cashOpen ? "CASH" : "UPI", amount: fromPaise(totalPaise) }]);
  }, [open, totalPaise, cashOpen]);

  const paid = tenders.reduce((n, t) => n + toPaise(t.amount), 0);
  const remaining = totalPaise - paid;
  const cashTender = tenders.find((t) => t.method === "CASH");
  const change = cashTender?.tendered ? toPaise(cashTender.tendered) - toPaise(cashTender.amount) : 0;
  const upiPending = tenders.some((t) => t.method === "UPI" && !t.upiConfirmed);
  const problem =
    remaining !== 0 ? `${remaining > 0 ? "Still to pay" : "Over by"} ${formatMoney(fromPaise(Math.abs(remaining)))}`
    : cashTender && !cashOpen ? "Open the cash register to take cash"
    : change < 0 ? "Cash given is less than the cash amount"
    : upiPending ? "Confirm the UPI payment"
    : null;

  const update = (i: number, patch: Partial<Tender>) => setTenders((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const only = (method: PosPaymentMethod) => setTenders([{ method, amount: fromPaise(totalPaise) }]);
  const addSplit = () => setTenders((ts) => [...ts, { method: ts.some((t) => t.method === "CARD") ? "UPI" : "CARD", amount: fromPaise(Math.max(remaining, 0)) }]);

  const submit = () => {
    if (!problem && !pending) onPay(tenders);
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" onKeyDown={(e) => { if (e.key === "F8") { e.preventDefault(); submit(); } }}>
        <DialogHeader>
          <DialogTitle className="flex items-baseline justify-between gap-4">
            <span>Payment</span>
            <span className="tabular text-2xl">{formatMoney(fromPaise(totalPaise))}</span>
          </DialogTitle>
          <DialogDescription>Pick how the customer pays. Split across methods with “Add another”.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-2" role="group" aria-label="Pay all by">
          {METHODS.map((m) => (
            <Button key={m.method} type="button" variant={tenders.length === 1 && tenders[0].method === m.method ? "primary" : "outline"} className="h-16 flex-col gap-1" onClick={() => only(m.method)} disabled={m.method === "CASH" && !cashOpen}>
              <m.icon className="size-5" />
              <span className="text-xs">{m.label}</span>
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {tenders.map((t, i) => (
            <TenderRow key={i} tender={t} ctx={ctx} split={tenders.length > 1} onChange={(p) => update(i, p)} onRemove={() => setTenders((ts) => ts.filter((_, j) => j !== i))} />
          ))}
          {tenders.length < 5 && remaining > 0 ? (
            <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={addSplit}>
              <Plus /> Add another payment
            </Button>
          ) : null}
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <span className={cn(problem ? "text-destructive" : "text-success", "font-medium")} role="status">
            {problem ?? "Ready to complete"}
          </span>
          {change > 0 ? (
            <span className="text-base font-semibold">
              Change <span className="tabular">{formatMoney(fromPaise(change))}</span>
            </span>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Back
          </Button>
          <Button onClick={submit} disabled={Boolean(problem)} loading={pending} size="lg">
            <CheckCircle2 /> Complete sale (F8)
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

function TenderRow({ tender, ctx, split, onChange, onRemove }: { tender: Tender; ctx: PosContext; split: boolean; onChange: (p: Partial<Tender>) => void; onRemove: () => void }) {
  const label = METHODS.find((m) => m.method === tender.method)?.label ?? tender.method;
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-28 flex-col gap-1">
          <span className="text-xs text-muted-foreground">Method</span>
          <select
            aria-label="Payment method"
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={tender.method}
            onChange={(e) => onChange({ method: e.target.value as PosPaymentMethod, tendered: undefined, reference: undefined, razorpayQrId: undefined, upiConfirmed: undefined })}
          >
            {METHODS.map((m) => (
              <option key={m.method} value={m.method}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex w-36 flex-col gap-1">
          <span className="text-xs text-muted-foreground">{label} amount</span>
          <Input inputMode="decimal" aria-label={`${label} amount`} value={tender.amount} onChange={(e) => onChange({ amount: e.target.value, razorpayQrId: undefined, upiConfirmed: undefined })} leftElement={<span className="text-xs">₹</span>} />
        </label>
        {tender.method === "CASH" ? (
          <label className="flex w-36 flex-col gap-1">
            <span className="text-xs text-muted-foreground">Cash given</span>
            <Input inputMode="decimal" aria-label="Cash given" autoFocus value={tender.tendered ?? ""} onChange={(e) => onChange({ tendered: e.target.value })} placeholder={tender.amount} leftElement={<span className="text-xs">₹</span>} />
          </label>
        ) : tender.method !== "UPI" ? (
          <label className="flex min-w-40 flex-1 flex-col gap-1">
            <span className="text-xs text-muted-foreground">{tender.method === "CHEQUE" ? "Cheque number" : tender.method === "CARD" ? "Card slip / last 4 digits" : "UTR / reference"} (optional)</span>
            <Input aria-label="Reference" value={tender.reference ?? ""} onChange={(e) => onChange({ reference: e.target.value })} />
          </label>
        ) : null}
        {split ? (
          <Button type="button" variant="ghost" size="icon" aria-label="Remove this payment" onClick={onRemove}>
            <Trash2 />
          </Button>
        ) : null}
      </div>
      {tender.method === "CASH" ? (
        <div className="flex flex-wrap gap-1.5">
          {quickCash(Number(tender.amount)).map((n) => (
            <Button key={n} type="button" variant="outline" size="sm" onClick={() => onChange({ tendered: String(n) })}>
              ₹{n}
            </Button>
          ))}
        </div>
      ) : null}
      {tender.method === "UPI" ? <UpiPanel tender={tender} ctx={ctx} onChange={onChange} /> : null}
    </div>
  );
}

/** Notes a customer is likely to hand over for this amount. */
function quickCash(amount: number) {
  if (!amount) return [];
  const notes = [10, 20, 50, 100, 200, 500, 2000];
  const out = new Set<number>([Math.ceil(amount)]);
  for (const n of notes) out.add(Math.ceil(amount / n) * n);
  return [...out].filter((n) => n >= amount).sort((a, b) => a - b).slice(0, 5);
}

function UpiPanel({ tender, ctx, onChange }: { tender: Tender; ctx: PosContext; onChange: (p: Partial<Tender>) => void }) {
  const [qr, setQr] = React.useState<UpiQr | null>(null);
  const [image, setImage] = React.useState<string | null>(null);
  const make = useMutation({
    mutationFn: () => posApi.upiQr(Number(tender.amount).toFixed(2)),
    onSuccess: async (q) => {
      setQr(q);
      setImage(q.provider === "razorpay" ? q.imageUrl : await QRCode.toDataURL(q.upiUri, { margin: 1, width: 220 }));
      onChange({ razorpayQrId: q.provider === "razorpay" ? q.qrId : undefined, upiConfirmed: false });
    },
  });
  // Razorpay QR: ask every 3 seconds until the money arrives
  const status = useQuery({
    queryKey: ["pos", "upi-qr", qr?.provider === "razorpay" ? qr.qrId : null],
    queryFn: () => posApi.upiQrStatus((qr as { qrId: string }).qrId),
    enabled: qr?.provider === "razorpay" && !tender.upiConfirmed,
    refetchInterval: 3000,
  });
  React.useEffect(() => {
    // Reflect Razorpay's answer in the tender
    if (status.data?.paid && !tender.upiConfirmed) onChange({ upiConfirmed: true });
  }, [status.data?.paid, tender.upiConfirmed, onChange]);

  if (!ctx.upi) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">UPI isn&apos;t set up (connect Razorpay or add the shop UPI ID in Settings). Confirm the payment on the customer&apos;s phone.</span>
        <Button type="button" size="sm" variant={tender.upiConfirmed ? "primary" : "outline"} onClick={() => onChange({ upiConfirmed: !tender.upiConfirmed })}>
          {tender.upiConfirmed ? "Received ✓" : "Mark received"}
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-4">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- QR from Razorpay or generated locally
        <img src={image} alt={`UPI QR for ${formatMoney(tender.amount)}`} className="size-36 rounded-md border bg-white p-1" />
      ) : null}
      <div className="flex flex-col gap-2 text-sm">
        {!qr ? (
          <Button type="button" variant="outline" onClick={() => make.mutate()} loading={make.isPending} disabled={!(Number(tender.amount) > 0)}>
            <QrCode /> Show QR for {formatMoney(Number(tender.amount || 0).toFixed(2))}
          </Button>
        ) : qr.provider === "razorpay" ? (
          tender.upiConfirmed ? <span className="font-medium text-success">Paid ✓ (confirmed by Razorpay)</span> : <span className="text-muted-foreground">Waiting for the payment… (checks every few seconds)</span>
        ) : (
          <>
            <span className="text-muted-foreground">Customer scans and pays. Check the shop&apos;s UPI app, then:</span>
            <Button type="button" size="sm" variant={tender.upiConfirmed ? "primary" : "outline"} onClick={() => onChange({ upiConfirmed: !tender.upiConfirmed })}>
              {tender.upiConfirmed ? "Received ✓" : "Mark received"}
            </Button>
          </>
        )}
        {make.error ? <span className="text-destructive">{errorMessage(make.error, "Couldn't make the QR")}</span> : null}
      </div>
    </div>
  );
}
