"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { ordersApi, type Order, type OrderItem } from "@/lib/api/modules/orders";
import type { AddressSnapshot } from "@/lib/api/modules/customers";
import { formatMoney } from "@/lib/format";
import { amountInWords, stateName } from "@/lib/gst";

/** Printable tax invoice (A4) or till receipt (80mm) for one order: /print/invoice/:id[?format=receipt] */
export default function PrintInvoicePage() {
  return (
    <ProtectedRoute requiredScope="tenant" requiredPermission="order:read">
      <PrintInvoice />
    </ProtectedRoute>
  );
}

function PrintInvoice() {
  const { id } = useParams<{ id: string }>();
  const receipt = useSearchParams().get("format") === "receipt";
  const order = useQuery({ queryKey: ["order", id], queryFn: () => ordersApi.getById(id) });
  const o = order.data;
  const upiQr = useUpiQr(o);

  const autoprint = useSearchParams().get("autoprint") === "1";
  React.useEffect(() => {
    if (o) document.title = `${o.invoiceNumber ?? "Invoice"} · ${o.sellerSnapshot?.name ?? "PulseOps"}`;
    // Opened from the counter: print straight away (after the UPI QR, if any, has had a moment to draw)
    if (o && autoprint) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [o, autoprint]);

  if (order.isLoading) return <p className="p-8 text-sm text-muted-foreground">Loading invoice…</p>;
  if (!o) return <p className="p-8 text-sm text-destructive">This invoice could not be loaded.</p>;

  return (
    <div className="min-h-screen bg-muted/40 py-8 print:bg-white print:py-0">
      <style>{`@media print { @page { size: ${receipt ? "80mm auto" : "A4"}; margin: ${receipt ? "4mm" : "12mm"}; } body { background: white !important; } }`}</style>
      <div className="mx-auto mb-4 flex max-w-[210mm] justify-end gap-2 px-4 print:hidden">
        <Button onClick={() => window.print()}>
          <Printer /> Print
        </Button>
      </div>
      {receipt ? <Receipt o={o} upiQr={upiQr} /> : <A4Invoice o={o} upiQr={upiQr} />}
    </div>
  );
}

/** A UPI "scan to pay" QR for the invoice total when the shop has a UPI ID and the order isn't paid. */
function useUpiQr(o?: Order) {
  const [src, setSrc] = React.useState<string | null>(null);
  const upiId = o?.sellerSnapshot?.upiId;
  const amount = o?.total;
  React.useEffect(() => {
    if (!upiId || !amount) return;
    const params = new URLSearchParams({ pa: upiId, pn: o?.sellerSnapshot?.name ?? "", am: Number(amount).toFixed(2), cu: "INR", tn: o?.invoiceNumber ?? "" });
    QRCode.toDataURL(`upi://pay?${params.toString()}`, { margin: 1, width: 240 })
      .then(setSrc)
      .catch(() => setSrc(null));
  }, [upiId, amount, o?.sellerSnapshot?.name, o?.invoiceNumber]);
  return upiId && amount ? src : null;
}

const money = (o: Order, v?: string | null) => formatMoney(v ?? "0", o.currency);
const isTaxInvoice = (o: Order) => Number(o.taxTotal) > 0 || !["COMPOSITION", "UNREGISTERED"].includes(o.sellerSnapshot?.registrationType ?? "");

function addressLines(a?: AddressSnapshot | null): string[] {
  if (!a) return [];
  return [a.line1, a.line2, [a.city, a.state, a.postalCode].filter(Boolean).join(", ")].filter(Boolean) as string[];
}

function A4Invoice({ o, upiQr }: { o: Order; upiQr: string | null }) {
  const seller = o.sellerSnapshot;
  const buyer = o.buyerSnapshot;
  const inter = o.supplyType === "INTER";
  const items = o.items ?? [];
  const bySlab = taxSlabs(items);

  return (
    <article className="mx-auto max-w-[210mm] bg-white p-10 text-[12px] leading-relaxed text-zinc-900 shadow-sm print:max-w-none print:p-0 print:shadow-none">
      <header className="flex items-start justify-between gap-6 border-b border-zinc-300 pb-5">
        <div>
          <h1 className="text-xl font-bold">{seller?.tradeName || seller?.name || "Invoice"}</h1>
          {seller?.tradeName && seller.name ? <p>{seller.name}</p> : null}
          {seller?.address ? (
            <p className="text-zinc-600">
              {[seller.address.line1, seller.address.line2].filter(Boolean).join(", ")}
              <br />
              {seller.address.city} {seller.address.pincode}
              {seller.stateName ? `, ${seller.stateName}` : ""}
            </p>
          ) : null}
          <p className="text-zinc-600">{[seller?.phone, seller?.email].filter(Boolean).join(" · ")}</p>
          {seller?.gstin ? <p className="mt-1 font-mono">GSTIN {seller.gstin}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tracking-wide">{isTaxInvoice(o) ? "TAX INVOICE" : "BILL OF SUPPLY"}</p>
          <dl className="mt-2 grid grid-cols-[auto_auto] justify-end gap-x-3 gap-y-0.5">
            <dt className="text-zinc-500">Invoice no.</dt>
            <dd className="font-mono font-semibold">{o.invoiceNumber ?? o.id.slice(0, 8).toUpperCase()}</dd>
            <dt className="text-zinc-500">Date</dt>
            <dd>{new Date(o.invoiceDate ?? o.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</dd>
            {o.placeOfSupply ? (
              <>
                <dt className="text-zinc-500">Place of supply</dt>
                <dd>
                  {stateName(o.placeOfSupply)} ({o.placeOfSupply})
                </dd>
              </>
            ) : null}
          </dl>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-6 border-b border-zinc-300 py-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Bill to</p>
          <p className="font-semibold">{buyer?.name}</p>
          {buyer?.contactName ? <p>Attn: {buyer.contactName}</p> : null}
          {addressLines(o.billingAddress ?? o.shippingAddress).map((l) => (
            <p key={l} className="text-zinc-600">
              {l}
            </p>
          ))}
          {buyer?.gstin ? <p className="mt-1 font-mono">GSTIN {buyer.gstin}</p> : null}
          {buyer?.pan ? <p className="font-mono">PAN {buyer.pan}</p> : null}
          {buyer?.phone ? <p className="text-zinc-600">{buyer.phone}</p> : null}
        </div>
        {o.shippingAddress ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Ship to</p>
            <p className="font-semibold">{[o.shippingAddress.firstName, o.shippingAddress.lastName].filter(Boolean).join(" ") || buyer?.name}</p>
            {addressLines(o.shippingAddress).map((l) => (
              <p key={l} className="text-zinc-600">
                {l}
              </p>
            ))}
          </div>
        ) : null}
      </section>

      <table className="mt-5 w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-y border-zinc-400 bg-zinc-100 text-left">
            <th className="px-2 py-1.5">#</th>
            <th className="px-2 py-1.5">Item</th>
            <th className="px-2 py-1.5">HSN/SAC</th>
            <th className="px-2 py-1.5 text-right">Qty</th>
            <th className="px-2 py-1.5 text-right">Rate</th>
            <th className="px-2 py-1.5 text-right">Disc.</th>
            <th className="px-2 py-1.5 text-right">Taxable</th>
            <th className="px-2 py-1.5 text-right">GST</th>
            {inter ? <th className="px-2 py-1.5 text-right">IGST</th> : (
              <>
                <th className="px-2 py-1.5 text-right">CGST</th>
                <th className="px-2 py-1.5 text-right">SGST</th>
              </>
            )}
            <th className="px-2 py-1.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i, n) => (
            <tr key={i.id} className="border-b border-zinc-200 align-top">
              <td className="px-2 py-1.5">{n + 1}</td>
              <td className="px-2 py-1.5">
                {i.productNameSnapshot}
                <span className="block font-mono text-[10px] text-zinc-500">{i.skuSnapshot}</span>
              </td>
              <td className="px-2 py-1.5 font-mono">{i.hsnCode ?? "—"}</td>
              <td className="px-2 py-1.5 text-right">{i.quantity}</td>
              <td className="px-2 py-1.5 text-right">{money(o, i.unitPrice)}</td>
              <td className="px-2 py-1.5 text-right">{Number(i.discount) ? money(o, i.discount) : "—"}</td>
              <td className="px-2 py-1.5 text-right">{money(o, i.taxableValue ?? i.lineTotal)}</td>
              <td className="px-2 py-1.5 text-right">{Number(i.gstRatePercent ?? 0)}%</td>
              {inter ? <td className="px-2 py-1.5 text-right">{money(o, i.igst)}</td> : (
                <>
                  <td className="px-2 py-1.5 text-right">{money(o, i.cgst)}</td>
                  <td className="px-2 py-1.5 text-right">{money(o, i.sgst)}</td>
                </>
              )}
              <td className="px-2 py-1.5 text-right font-medium">{money(o, i.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-5 grid grid-cols-[1fr_auto] gap-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Amount in words</p>
          <p className="font-medium">{amountInWords(o.total)}</p>
          {bySlab.length ? (
            <table className="mt-4 border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-zinc-300 text-left text-zinc-500">
                  <th className="pr-4">GST rate</th>
                  <th className="pr-4 text-right">Taxable</th>
                  {inter ? <th className="pr-4 text-right">IGST</th> : (
                    <>
                      <th className="pr-4 text-right">CGST</th>
                      <th className="pr-4 text-right">SGST</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {bySlab.map((s) => (
                  <tr key={s.rate}>
                    <td className="pr-4">{s.rate}%</td>
                    <td className="pr-4 text-right">{formatMoney(s.taxable.toFixed(2), o.currency)}</td>
                    {inter ? <td className="pr-4 text-right">{formatMoney(s.igst.toFixed(2), o.currency)}</td> : (
                      <>
                        <td className="pr-4 text-right">{formatMoney(s.cgst.toFixed(2), o.currency)}</td>
                        <td className="pr-4 text-right">{formatMoney(s.sgst.toFixed(2), o.currency)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
        <dl className="grid min-w-56 grid-cols-[1fr_auto] gap-x-6 gap-y-1">
          <dt className="text-zinc-500">Taxable value</dt>
          <dd className="text-right">{money(o, sum(items, (i) => i.taxableValue ?? i.lineTotal))}</dd>
          {inter ? (
            <>
              <dt className="text-zinc-500">IGST</dt>
              <dd className="text-right">{money(o, o.igstTotal)}</dd>
            </>
          ) : (
            <>
              <dt className="text-zinc-500">CGST</dt>
              <dd className="text-right">{money(o, o.cgstTotal)}</dd>
              <dt className="text-zinc-500">SGST</dt>
              <dd className="text-right">{money(o, o.sgstTotal)}</dd>
            </>
          )}
          {Number(o.shippingTotal) ? (
            <>
              <dt className="text-zinc-500">Shipping</dt>
              <dd className="text-right">{money(o, o.shippingTotal)}</dd>
            </>
          ) : null}
          <dt className="border-t border-zinc-400 pt-1 text-sm font-bold">Total</dt>
          <dd className="border-t border-zinc-400 pt-1 text-right text-sm font-bold">{money(o, o.total)}</dd>
        </dl>
      </section>

      <footer className="mt-8 grid grid-cols-[1fr_auto_auto] items-end gap-8 border-t border-zinc-300 pt-5">
        <div className="text-zinc-600">
          {seller?.bank ? (
            <p>
              <span className="font-semibold text-zinc-900">Bank:</span> {seller.bank.name}
              {seller.bank.accountNumber ? ` · A/c ${seller.bank.accountNumber}` : ""}
              {seller.bank.ifsc ? ` · IFSC ${seller.bank.ifsc}` : ""}
            </p>
          ) : null}
          {seller?.terms ? <p className="mt-2 whitespace-pre-line text-[11px]">{seller.terms}</p> : null}
          <p className="mt-2 text-[10px] text-zinc-400">This is a computer-generated invoice.</p>
        </div>
        {upiQr ? (
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
            <img src={upiQr} alt={`UPI QR to pay ${money(o, o.total)}`} className="size-24" />
            <p className="text-[10px] text-zinc-500">Scan to pay with UPI</p>
          </div>
        ) : <span />}
        <div className="text-center">
          <p className="text-zinc-500">For {seller?.name ?? ""}</p>
          <div className="h-12" />
          <p className="border-t border-zinc-400 pt-1">{seller?.signatory ? `${seller.signatory} · ` : ""}Authorised signatory</p>
        </div>
      </footer>
    </article>
  );
}

function Receipt({ o, upiQr }: { o: Order; upiQr: string | null }) {
  const seller = o.sellerSnapshot;
  const inter = o.supplyType === "INTER";
  return (
    <article className="mx-auto w-[80mm] bg-white p-4 font-mono text-[11px] leading-snug text-black shadow-sm print:w-full print:p-0 print:shadow-none">
      <header className="text-center">
        <p className="text-sm font-bold">{seller?.tradeName || seller?.name}</p>
        {seller?.address ? <p>{[seller.address.line1, seller.address.city, seller.address.pincode].filter(Boolean).join(", ")}</p> : null}
        {seller?.phone ? <p>Ph {seller.phone}</p> : null}
        {seller?.gstin ? <p>GSTIN {seller.gstin}</p> : null}
        <p className="mt-1 font-bold">{isTaxInvoice(o) ? "TAX INVOICE" : "BILL OF SUPPLY"}</p>
      </header>
      <div className="my-2 border-y border-dashed border-black py-1">
        <p>Bill: {o.invoiceNumber ?? o.id.slice(0, 8).toUpperCase()}</p>
        <p>{new Date(o.invoiceDate ?? o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
        <p>To: {o.buyerSnapshot?.name}</p>
      </div>
      {(o.items ?? []).map((i) => (
        <div key={i.id} className="mb-1">
          <p>{i.productNameSnapshot}</p>
          <p className="flex justify-between">
            <span>
              {i.quantity} × {Number(i.unitPrice).toFixed(2)}
              {Number(i.gstRatePercent ?? 0) ? ` @${Number(i.gstRatePercent)}%` : ""}
            </span>
            <span>{Number(i.lineTotal).toFixed(2)}</span>
          </p>
        </div>
      ))}
      <div className="mt-2 border-t border-dashed border-black pt-1">
        <Row label="Taxable" value={sum(o.items ?? [], (i) => i.taxableValue ?? i.lineTotal)} />
        {inter ? <Row label="IGST" value={o.igstTotal} /> : (
          <>
            <Row label="CGST" value={o.cgstTotal} />
            <Row label="SGST" value={o.sgstTotal} />
          </>
        )}
        {Number(o.shippingTotal) ? <Row label="Shipping" value={o.shippingTotal} /> : null}
        <p className="mt-1 flex justify-between border-t border-black pt-1 text-sm font-bold">
          <span>TOTAL</span>
          <span>₹{Number(o.total).toFixed(2)}</span>
        </p>
      </div>
      {upiQr ? (
        <div className="mt-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
          <img src={upiQr} alt="UPI QR" className="mx-auto size-28" />
          <p>Scan to pay with UPI</p>
        </div>
      ) : null}
      <p className="mt-3 text-center">Thank you! Visit again.</p>
    </article>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <p className="flex justify-between">
      <span>{label}</span>
      <span>{Number(value ?? 0).toFixed(2)}</span>
    </p>
  );
}

function sum(items: OrderItem[], pick: (i: OrderItem) => string | undefined) {
  return items.reduce((s, i) => s + Number(pick(i) ?? 0), 0).toFixed(2);
}

/** Taxable value and tax per GST rate, for the summary under the items. */
function taxSlabs(items: OrderItem[]) {
  const slabs = new Map<number, { rate: number; taxable: number; cgst: number; sgst: number; igst: number }>();
  for (const i of items) {
    const rate = Number(i.gstRatePercent ?? 0);
    if (!rate) continue;
    const s = slabs.get(rate) ?? { rate, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    s.taxable += Number(i.taxableValue ?? 0);
    s.cgst += Number(i.cgst ?? 0);
    s.sgst += Number(i.sgst ?? 0);
    s.igst += Number(i.igst ?? 0);
    slabs.set(rate, s);
  }
  return [...slabs.values()].sort((a, b) => a.rate - b.rate);
}
