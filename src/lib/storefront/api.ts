/**
 * Storefront (shopper) API client — Phase 32 public commerce API under /storefront/:store.
 *
 * Deliberately separate from the staff client: shopper tokens (scope "customer") only work for the store
 * that issued them, so they are stored per store and never touch the staff token store. Access tokens are
 * short-lived; a 401 triggers one single-flight refresh, then the request is retried once.
 */

import { publicEnv } from "@/config/env";
import { toApiError, ApiError, NetworkError } from "@/lib/api/errors";
import { serializeQuery, type QueryParams } from "@/lib/api/query";
import type { PaginationMeta } from "@/lib/api/pagination";
import { REFRESH_IN_COOKIE, refreshTokenBody, refreshTransportInit } from "@/lib/api/tokens";

// Shopper auth routes that issue, rotate or revoke a refresh token (cookie mode applies to these only)
const TOKEN_PATHS = new Set(["/auth/login", "/auth/set-password", "/auth/refresh", "/auth/logout"]);

// ─── Types (mirror storefront.* responses) ──────────────────────────────────

export interface Store {
  slug: string;
  name: string;
  currency: string | null;
  locale: string | null;
  timezone: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  /** Effective GST % for previews; checkout totals come from the server. */
  gstRatePercent: number;
  onlinePayment: { provider: "razorpay"; enabled: boolean };
}

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
}

export interface StoreProductSummary {
  id: string;
  name: string;
  brand: string | null;
  priceFrom: string;
  priceTo: string;
  currency: string;
  inStock: boolean;
  image: { url: string; altText?: string | null } | null;
}

export interface StoreVariant {
  id: string;
  sku: string;
  price: string;
  attributes: Record<string, string>;
  inStock: boolean;
}

export interface StoreProduct extends Omit<StoreProductSummary, "priceFrom" | "priceTo" | "inStock" | "image"> {
  description: string | null;
  categories: Array<{ id: string; name: string; slug: string }>;
  images: Array<{ url: string; altText?: string | null }>;
  variants: StoreVariant[];
}

export interface Shopper {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export interface CartLine {
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  attributes: Record<string, string>;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  available: boolean;
  /** Why the line can't be checked out as-is (out of stock, no longer sold…), else null. */
  issue: string | null;
}

export interface Cart {
  items: CartLine[];
  itemCount: number;
  subtotal: string;
  currency: string;
  readyForCheckout: boolean;
}

export interface ShopAddress {
  id: string;
  type: "SHIPPING" | "BILLING";
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

export type ShopAddressBody = Omit<ShopAddress, "id" | "isDefault"> & { isDefault?: boolean };

export interface ShopOrderPayment {
  id: string;
  status: string;
  amount: string;
  currency: string;
  createdAt: string;
}

export interface ShopOrder {
  id: string;
  number: string;
  status: string;
  createdAt: string;
  currency: string;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  shippingTotal: string;
  total: string;
  /** Tax invoice (Phase 38) */
  invoiceNumber?: string | null;
  supplyType?: "INTRA" | "INTER" | null;
  cgstTotal?: string;
  sgstTotal?: string;
  igstTotal?: string;
  items: Array<{ productName: string; variantName: string | null; sku: string; unitPrice: string; quantity: number; lineTotal: string; hsnCode?: string | null; gstRatePercent?: number }>;
  shippingAddress: (Omit<ShopAddress, "id" | "isDefault"> & { addressId: string }) | null;
  billingAddress: (Omit<ShopAddress, "id" | "isDefault"> & { addressId: string }) | null;
  timeline: Array<{ status: string; at: string }>;
  payments: ShopOrderPayment[];
}

/** What Razorpay's web checkout needs; null when the shop settles payments by hand. */
export interface RazorpayCheckout {
  provider: "razorpay";
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
}

export interface StartedPayment {
  id: string;
  status: string;
  amount: string;
  currency: string;
  provider: string;
  providerPaymentId: string | null;
  checkout: RazorpayCheckout | null;
}

interface Session {
  accessToken: string;
  /** The token itself, or REFRESH_IN_COOKIE when the store's httpOnly cookie holds it. */
  refreshToken: string;
  sessionId: string;
  customer: Shopper;
}

// ─── Session storage (per store) ────────────────────────────────────────────

const storageKey = (slug: string) => `pulseops:shop:${slug}`;

function readSession(slug: string): Session | null {
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeSession(slug: string, session: Session | null) {
  try {
    if (session) window.localStorage.setItem(storageKey(slug), JSON.stringify(session));
    else window.localStorage.removeItem(storageKey(slug));
  } catch {
    // storage unavailable (private mode): the session lives for this page only
  }
  window.dispatchEvent(new CustomEvent("pulseops:shopper-session", { detail: { slug } }));
}

/** In cookie mode the response carries no refresh token; remember that the cookie holds it. */
function withStoredRefresh(session: Session): Session {
  return { ...session, refreshToken: session.refreshToken ?? REFRESH_IN_COOKIE };
}

// ─── Client ─────────────────────────────────────────────────────────────────

interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export class StorefrontClient {
  private refreshing: Promise<boolean> | null = null;

  constructor(readonly slug: string) {}

  private url(path: string, params?: QueryParams) {
    return `${publicEnv.apiBaseUrl}/storefront/${encodeURIComponent(this.slug)}${path}${params ? serializeQuery(params) : ""}`;
  }

  session(): Session | null {
    return typeof window === "undefined" ? null : readSession(this.slug);
  }

  private async send<T>(method: string, path: string, opts: { body?: unknown; params?: QueryParams; auth?: boolean; retried?: boolean } = {}): Promise<Envelope<T>> {
    const session = opts.auth ? this.session() : null;
    const transport = TOKEN_PATHS.has(path) ? refreshTransportInit() : { headers: {} };
    let res: Response;
    try {
      res = await fetch(this.url(path, opts.params), {
        method,
        headers: {
          Accept: "application/json",
          ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
          ...transport.headers,
        },
        credentials: transport.credentials,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });
    } catch (cause) {
      throw new NetworkError("Can't reach the store right now. Check your connection and try again.", { cause });
    }

    if (res.status === 401 && opts.auth && !opts.retried && session) {
      if (await this.refresh()) return this.send<T>(method, path, { ...opts, retried: true });
      writeSession(this.slug, null);
    }

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw toApiError({ status: res.status, backendCode: json?.error?.code, message: json?.error?.message, details: json?.error?.details, requestId: json?.requestId });
    }
    return json as Envelope<T>;
  }

  /** Single-flight refresh-token rotation; false when the session can't be renewed. */
  refresh(): Promise<boolean> {
    if (!this.refreshing) {
      this.refreshing = (async () => {
        const session = this.session();
        if (!session) return false;
        try {
          const res = await this.send<Session>("POST", "/auth/refresh", { body: refreshTokenBody(session.refreshToken) });
          writeSession(this.slug, withStoredRefresh(res.data));
          return true;
        } catch {
          return false;
        }
      })().finally(() => {
        this.refreshing = null;
      });
    }
    return this.refreshing;
  }

  // Catalog (public)
  getStore = () => this.send<Store>("GET", "").then((r) => r.data);
  listCategories = () => this.send<StoreCategory[]>("GET", "/categories").then((r) => r.data);
  listProducts = (params: QueryParams) => this.send<StoreProductSummary[]>("GET", "/products", { params });
  getProduct = (id: string) => this.send<StoreProduct>("GET", `/products/${id}`).then((r) => r.data);

  // Auth
  register = (body: { email: string; firstName: string; lastName: string; phone?: string }) =>
    this.send<{ message: string; devToken?: string }>("POST", "/auth/register", { body }).then((r) => r.data);
  forgotPassword = (email: string) => this.send<{ message: string; devToken?: string }>("POST", "/auth/forgot-password", { body: { email } }).then((r) => r.data);
  async setPassword(token: string, password: string) {
    const res = await this.send<Session>("POST", "/auth/set-password", { body: { token, password } });
    writeSession(this.slug, withStoredRefresh(res.data));
    return res.data.customer;
  }
  async login(email: string, password: string) {
    const res = await this.send<Session>("POST", "/auth/login", { body: { email, password } });
    writeSession(this.slug, withStoredRefresh(res.data));
    return res.data.customer;
  }
  async logout() {
    const session = this.session();
    writeSession(this.slug, null);
    if (session) await this.send("POST", "/auth/logout", { body: refreshTokenBody(session.refreshToken) }).catch(() => undefined);
  }

  // Account
  getProfile = () => this.send<Shopper>("GET", "/account", { auth: true }).then((r) => r.data);
  updateProfile = (body: Partial<Pick<Shopper, "firstName" | "lastName" | "phone">>) => this.send<Shopper>("PATCH", "/account", { body, auth: true }).then((r) => r.data);
  listAddresses = () => this.send<ShopAddress[]>("GET", "/account/addresses", { auth: true }).then((r) => r.data);
  createAddress = (body: ShopAddressBody) => this.send<ShopAddress>("POST", "/account/addresses", { body, auth: true }).then((r) => r.data);
  updateAddress = (id: string, body: Partial<ShopAddressBody>) => this.send<ShopAddress>("PATCH", `/account/addresses/${id}`, { body, auth: true }).then((r) => r.data);
  deleteAddress = (id: string) => this.send<null>("DELETE", `/account/addresses/${id}`, { auth: true });
  listOrders = (params: QueryParams) => this.send<ShopOrder[]>("GET", "/account/orders", { params, auth: true });
  getOrder = (id: string) => this.send<ShopOrder>("GET", `/account/orders/${id}`, { auth: true }).then((r) => r.data);
  payOrder = (id: string) => this.send<StartedPayment>("POST", `/account/orders/${id}/pay`, { auth: true }).then((r) => r.data);
  verifyPayment = (paymentId: string, body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    this.send<StartedPayment>("POST", `/account/payments/${paymentId}/verify`, { body, auth: true }).then((r) => r.data);

  // Cart & checkout
  getCart = () => this.send<Cart>("GET", "/cart", { auth: true }).then((r) => r.data);
  setCartItem = (variantId: string, quantity: number) => this.send<Cart>("PUT", `/cart/items/${variantId}`, { body: { quantity }, auth: true }).then((r) => r.data);
  removeCartItem = (variantId: string) => this.send<Cart>("DELETE", `/cart/items/${variantId}`, { auth: true }).then((r) => r.data);
  checkout = (body: { shippingAddressId?: string; billingAddressId?: string }) =>
    this.send<{ order: ShopOrder; payment: StartedPayment | null }>("POST", "/checkout", { body, auth: true }).then((r) => r.data);
}

/** Maps a host (custom domain or <slug>.<base domain>) to its store slug; null when none matches. */
export async function resolveStoreHost(host: string): Promise<string | null> {
  try {
    const res = await fetch(`${publicEnv.apiBaseUrl}/storefront/resolve${serializeQuery({ host })}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.slug ?? null;
  } catch {
    return null;
  }
}

export { ApiError };
