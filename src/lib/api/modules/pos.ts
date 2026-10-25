/**
 * Counter POS and cash register (backend Phase 39)
 * /pos/context, /pos/lookup, /pos/sales (Idempotency-Key), /pos/held-sales, /pos/upi-qr
 * /cash-registers, /cash-registers/:id/open|current, /cash-registers/sessions[/:id[/movements|/close]]
 */

import { apiClient } from "../client";
import type { Order } from "./orders";
import type { Payment } from "./payments";

export type PosPaymentMethod = "CASH" | "UPI" | "CARD" | "BANK" | "CHEQUE";

export interface CashTotals {
  openingFloat: string;
  cashSales: string;
  cashRefunds: string;
  cashIn: string;
  cashOut: string;
  expectedCash: string;
}

export interface CashMovement {
  id: string;
  type: "SALE" | "REFUND" | "CASH_IN" | "CASH_OUT";
  amount: string;
  reason: string | null;
  orderId: string | null;
  paymentId: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CashSession {
  id: string;
  registerId: string;
  registerName?: string;
  status: "OPEN" | "CLOSED";
  openingFloat: string;
  expectedCash: string | null;
  countedCash: string | null;
  /** counted − expected; negative = short */
  variance: string | null;
  openedBy: string | null;
  openedAt: string;
  closedBy: string | null;
  closedAt: string | null;
  note: string | null;
  totals: CashTotals;
  movements: CashMovement[];
}

export interface CashRegister {
  id: string;
  name: string;
  isActive: boolean;
  openSession: CashSession | null;
}

export interface PosContext {
  walkInCustomerId: string;
  warehouse: { id: string; name: string } | null;
  registers: CashRegister[];
  gstRatePercent: number;
  pricesIncludeTax: boolean;
  chargesGst: boolean;
  /** How UPI is taken: a Razorpay QR, a QR from the shop's UPI ID, or not set up. */
  upi: "razorpay" | "upi-id" | null;
  paymentMethods: PosPaymentMethod[];
}

export interface PosItem {
  variantId: string;
  productId: string;
  name: string;
  brand: string | null;
  sku: string;
  barcode: string | null;
  price: string;
  mrp: string | null;
  unit: string | null;
  hsnCode: string | null;
  gstRatePercent: number;
  stock: number;
  exactMatch: boolean;
}

export interface PosSaleBody {
  customerId?: string;
  warehouseId?: string;
  registerId?: string;
  note?: string;
  items: Array<{ variantId: string; quantity: number; discount?: string }>;
  payments: Array<{ method: PosPaymentMethod; amount: string; tendered?: string; reference?: string; razorpayQrId?: string }>;
}

export interface PosSaleResult {
  order: Order;
  payments: Payment[];
  change: string;
}

export interface HeldSale {
  id: string;
  label: string | null;
  cart: { customerId?: string; items: Array<{ variantId: string; quantity: number; discount?: string } & Partial<PosItem>> };
  createdAt: string;
}

export type UpiQr =
  | { provider: "razorpay"; qrId: string; imageUrl: string; amount: string; expiresInMinutes: number }
  | { provider: "upi-id"; upiUri: string; amount: string };

export const posApi = {
  context: () => apiClient.get<PosContext>("/pos/context"),
  lookup: (q: string, warehouseId?: string) => apiClient.get<PosItem[]>("/pos/lookup", { params: { q, warehouseId, limit: 20 } }),
  /** The key makes a double-clicked or retried sale happen once. */
  sale: (body: PosSaleBody, idempotencyKey: string) => apiClient.post<PosSaleResult>("/pos/sales", body, { headers: { "Idempotency-Key": idempotencyKey } }),
  listHeld: () => apiClient.get<HeldSale[]>("/pos/held-sales"),
  hold: (body: { label?: string; cart: HeldSale["cart"] }) => apiClient.post<HeldSale>("/pos/held-sales", body),
  removeHeld: (id: string) => apiClient.del<null>(`/pos/held-sales/${id}`),
  upiQr: (amount: string) => apiClient.post<UpiQr>("/pos/upi-qr", { amount }),
  upiQrStatus: (qrId: string) => apiClient.get<{ paid: boolean; amount?: string; razorpayPaymentId?: string }>(`/pos/upi-qr/${qrId}`),
};

export const cashRegistersApi = {
  list: () => apiClient.get<CashRegister[]>("/cash-registers"),
  create: (name: string) => apiClient.post<CashRegister>("/cash-registers", { name }),
  open: (registerId: string, openingFloat: string, note?: string) => apiClient.post<CashSession>(`/cash-registers/${registerId}/open`, { openingFloat, note }),
  current: (registerId: string) => apiClient.get<CashSession | null>(`/cash-registers/${registerId}/current`),
  sessions: (params?: { registerId?: string; page?: number; limit?: number }) =>
    apiClient.requestEnvelope<CashSession[]>("/cash-registers/sessions", { params: params as Record<string, unknown> }),
  session: (id: string) => apiClient.get<CashSession>(`/cash-registers/sessions/${id}`),
  move: (sessionId: string, body: { type: "CASH_IN" | "CASH_OUT"; amount: string; reason: string }) => apiClient.post<CashSession>(`/cash-registers/sessions/${sessionId}/movements`, body),
  close: (sessionId: string, countedCash: string, note?: string) => apiClient.post<CashSession>(`/cash-registers/sessions/${sessionId}/close`, { countedCash, note }),
};

// ── Totals, worked out exactly like the server (integer paise, half-up) ──

const paise = (v: string | number) => Math.round(Number(v) * 100);

export interface CartLine {
  item: PosItem;
  quantity: number;
  /** Rupees off this line */
  discount: number;
}

/** Subtotal (taxable value + discounts), GST and total for a cart, matching the invoice the server will issue. */
export function cartTotals(lines: CartLine[], ctx: Pick<PosContext, "pricesIncludeTax" | "chargesGst">) {
  let subtotal = 0;
  let discount = 0;
  let tax = 0;
  for (const l of lines) {
    const gross = paise(l.item.price) * l.quantity - paise(l.discount);
    const rate = ctx.chargesGst ? Math.round(l.item.gstRatePercent * 100) : 0;
    const lineTax = gross <= 0 || rate <= 0 ? 0 : ctx.pricesIncludeTax ? Math.round((gross * rate) / (10000 + rate)) : Math.round((gross * rate) / 10000);
    const taxable = ctx.pricesIncludeTax ? gross - lineTax : gross;
    subtotal += taxable + paise(l.discount);
    discount += paise(l.discount);
    tax += lineTax;
  }
  const total = subtotal - discount + tax;
  return { subtotal: subtotal / 100, discount: discount / 100, tax: tax / 100, total: total / 100 };
}
