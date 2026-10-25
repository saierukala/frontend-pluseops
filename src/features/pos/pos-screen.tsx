"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Banknote, CheckCircle2, FileText, LockKeyhole, Minus, PauseCircle, Plus, Printer, ScanBarcode, Search, ShoppingCart, Trash2, UserRound, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DialogContent, DialogDescription, DialogHeader, DialogRoot, DialogTitle } from "@/components/ui/dialog";
import { ComboboxField } from "@/components/app/combobox-field";
import { customersApi } from "@/lib/api/modules/customers";
import { cartTotals, posApi, type CartLine, type HeldSale, type PosItem, type PosSaleResult } from "@/lib/api/modules/pos";
import { usePermission } from "@/lib/auth/permission-context";
import { useAuth } from "@/lib/auth/auth-context";
import { formatMoney, fullName } from "@/lib/format";
import { errorMessage, toastError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import { PaymentDialog, type Tender } from "./payment-dialog";
import { CashMoveDialog, CloseRegisterDialog, OpenRegisterDialog } from "./register-dialogs";

const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export function PosScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const ctx = useQuery({ queryKey: ["pos", "context"], queryFn: () => posApi.context() });
  const c = ctx.data;
  const register = c?.registers[0];
  const session = register?.openSession ?? null;

  const [lines, setLines] = React.useState<CartLine[]>([]);
  const [customerId, setCustomerId] = React.useState<string>("");
  const [query, setQuery] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [paying, setPaying] = React.useState(false);
  const [saleKey, setSaleKey] = React.useState(newKey);
  const [done, setDone] = React.useState<PosSaleResult | null>(null);
  const [heldOpen, setHeldOpen] = React.useState(false);
  const [dialog, setDialog] = React.useState<"open" | "move" | "close" | null>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  const results = useQuery({
    queryKey: ["pos", "lookup", debounced, c?.warehouse?.id],
    queryFn: () => posApi.lookup(debounced, c?.warehouse?.id),
    enabled: debounced.length > 0 && Boolean(c),
  });
  const customers = useQuery({ queryKey: ["customers", "options"], queryFn: () => customersApi.listEnvelope({ limit: 100, sortBy: "lastName", sortOrder: "asc" }), enabled: Boolean(c) });
  const held = useQuery({ queryKey: ["pos", "held"], queryFn: () => posApi.listHeld() });

  const totals = c ? cartTotals(lines, c) : { subtotal: 0, discount: 0, tax: 0, total: 0 };
  const count = lines.reduce((n, l) => n + l.quantity, 0);

  const add = React.useCallback((item: PosItem) => {
    setLines((ls) => {
      const i = ls.findIndex((l) => l.item.variantId === item.variantId);
      if (i >= 0) return ls.map((l, j) => (j === i ? { ...l, quantity: l.quantity + 1 } : l));
      return [...ls, { item, quantity: 1, discount: 0 }];
    });
    setQuery("");
    searchRef.current?.focus();
  }, []);

  /** Enter in the search box: an exact barcode/SKU match (what a scanner types) is added straight away. */
  const addFromSearch = async () => {
    const term = query.trim();
    if (!term) return;
    try {
      const found = term === debounced && results.data ? results.data : await posApi.lookup(term, c?.warehouse?.id);
      const pick = found.find((f) => f.exactMatch) ?? (found.length === 1 ? found[0] : undefined);
      if (pick) add(pick);
      else if (!found.length) toast.error("Nothing found", { description: term });
    } catch (e) {
      toastError(e, "Search failed");
    }
  };

  const setQty = (variantId: string, quantity: number) => setLines((ls) => (quantity <= 0 ? ls.filter((l) => l.item.variantId !== variantId) : ls.map((l) => (l.item.variantId === variantId ? { ...l, quantity } : l))));
  const setDiscount = (variantId: string, discount: number) => setLines((ls) => ls.map((l) => (l.item.variantId === variantId ? { ...l, discount } : l)));
  const clear = () => {
    setLines([]);
    setCustomerId("");
    setSaleKey(newKey());
  };

  const sell = useMutation({
    mutationFn: (tenders: Tender[]) =>
      posApi.sale(
        {
          customerId: customerId || undefined,
          warehouseId: c?.warehouse?.id,
          registerId: register?.id,
          items: lines.map((l) => ({ variantId: l.item.variantId, quantity: l.quantity, ...(l.discount ? { discount: l.discount.toFixed(2) } : {}) })),
          payments: tenders.map((t) => ({ method: t.method, amount: Number(t.amount).toFixed(2), tendered: t.tendered ? Number(t.tendered).toFixed(2) : undefined, reference: t.reference || undefined, razorpayQrId: t.razorpayQrId })),
        },
        saleKey
      ),
    onSuccess: (result) => {
      setPaying(false);
      setDone(result);
      setLines([]);
      setCustomerId("");
      setSaleKey(newKey());
      queryClient.invalidateQueries({ queryKey: ["pos", "context"] });
      queryClient.invalidateQueries({ queryKey: ["pos", "lookup"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => toast.error("Sale not completed", { description: errorMessage(e) }),
  });

  const hold = useMutation({
    mutationFn: () => {
      const label = customerId ? fullName(customers.data?.data.find((x) => x.id === customerId)) : `${count} item${count === 1 ? "" : "s"} · ${formatMoney(totals.total.toFixed(2))}`;
      return posApi.hold({ label, cart: { customerId: customerId || undefined, items: lines.map((l) => ({ ...l.item, quantity: l.quantity, discount: l.discount ? l.discount.toFixed(2) : undefined })) } });
    },
    onSuccess: () => {
      toast.success("Sale held", { description: "Serve the next customer; resume it from Held." });
      clear();
      queryClient.invalidateQueries({ queryKey: ["pos", "held"] });
    },
    onError: (e) => toastError(e, "Couldn't hold the sale"),
  });

  const resume = useMutation({
    mutationFn: async (h: HeldSale) => {
      await posApi.removeHeld(h.id);
      return h;
    },
    onSuccess: (h) => {
      setLines(h.cart.items.map((i) => ({ item: i as PosItem, quantity: i.quantity, discount: Number(i.discount ?? 0) })));
      setCustomerId(h.cart.customerId ?? "");
      setHeldOpen(false);
      queryClient.invalidateQueries({ queryKey: ["pos", "held"] });
    },
    onError: (e) => toastError(e, "Couldn't resume the sale"),
  });

  // F2 search · F4 hold · F8 pay · Esc closes the receipt panel
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "F8" && lines.length && !paying) {
        e.preventDefault();
        setPaying(true);
      } else if (e.key === "F4" && lines.length && !paying) {
        e.preventDefault();
        hold.mutate();
      } else if (e.key === "Escape" && done) {
        setDone(null);
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lines.length, paying, done, hold]);

  const customerOptions = [
    { value: "", label: "Walk-in customer", hint: "No details needed" },
    ...(customers.data?.data ?? []).filter((x) => x.id !== c?.walkInCustomerId).map((x) => ({ value: x.id, label: x.companyName || fullName(x), hint: x.gstin ? `GSTIN ${x.gstin}` : x.email })),
  ];

  if (ctx.isLoading) return <div className="p-6"><Skeleton className="h-[80vh] w-full" /></div>;
  if (ctx.error || !c) return <p className="p-8 text-destructive">{errorMessage(ctx.error, "The counter could not be loaded.")}</p>;

  return (
    <div className="flex h-dvh flex-col bg-muted/30">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft /> Back
          </Link>
        </Button>
        <span className="flex items-center gap-2 font-semibold">
          <ShoppingCart className="size-4 text-primary" /> Counter
        </span>
        <span className="hidden text-sm text-muted-foreground sm:inline">{user ? `${user.firstName} · ` : ""}{c.warehouse?.name ?? "No warehouse"}</span>
        <div className="ml-auto flex items-center gap-2">
          {session ? (
            <>
              <Badge variant="secondary" className="hidden gap-1 sm:inline-flex">
                <Wallet className="size-3" /> {register?.name} · {formatMoney(session.totals.expectedCash)} in drawer
              </Badge>
              {hasPermission("cash_register:manage") ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setDialog("move")}>
                    <Banknote /> Cash in/out
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDialog("close")}>
                    <LockKeyhole /> Close register
                  </Button>
                </>
              ) : null}
            </>
          ) : hasPermission("cash_register:manage") && register ? (
            <Button size="sm" onClick={() => setDialog("open")}>
              <Wallet /> Open register
            </Button>
          ) : (
            <Badge variant="outline">Register closed: card/UPI only</Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => setHeldOpen(true)}>
            <PauseCircle /> Held {held.data?.length ? <Badge className="ml-1 h-5 px-1.5">{held.data.length}</Badge> : null}
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[1fr_26rem]">
        <section className="flex min-h-0 flex-col gap-3 rounded-xl border bg-background p-4">
          <div className="relative">
            <ScanBarcode className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              autoFocus
              aria-label="Scan or search items"
              className="h-12 pl-11 text-base"
              placeholder="Scan a barcode, or type SKU or name (F2)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addFromSearch();
                }
              }}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!debounced ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <Search className="size-8" />
                Scan or search to add items. Enter adds an exact barcode or SKU match.
                <span className="text-xs">F2 search · F4 hold · F8 pay</span>
              </div>
            ) : results.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : results.data?.length ? (
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-label="Search results">
                {results.data.map((r) => (
                  <li key={r.variantId}>
                    <button type="button" onClick={() => add(r)} disabled={r.stock <= 0} className="flex w-full flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50">
                      <span className="line-clamp-1 font-medium">{r.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{r.sku}{r.barcode ? ` · ${r.barcode}` : ""}</span>
                      <span className="flex w-full items-center justify-between text-sm">
                        <span className="tabular font-semibold">{formatMoney(r.price)}</span>
                        <span className={cn("text-xs", r.stock <= 0 ? "text-destructive" : "text-muted-foreground")}>{r.stock <= 0 ? "Out of stock" : `${r.stock} in stock`}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-6 text-center text-sm text-muted-foreground">No items match “{debounced}”.</p>
            )}
          </div>
        </section>

        <aside className="flex min-h-0 flex-col rounded-xl border bg-background" aria-label="Current sale">
          <div className="border-b p-3">
            <ComboboxField value={customerId} onChange={setCustomerId} options={customerOptions} placeholder="Walk-in customer" searchPlaceholder="Search customers…" />
          </div>
          <ul className="min-h-0 flex-1 divide-y overflow-y-auto" aria-label="Cart">
            {lines.length === 0 ? (
              <li className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
                <UserRound className="size-6" /> The bill is empty
              </li>
            ) : (
              lines.map((l) => (
                <li key={l.item.variantId} className="flex flex-col gap-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-medium">{l.item.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {formatMoney(l.item.price)} · {l.item.gstRatePercent}% GST{l.item.mrp ? ` · MRP ${formatMoney(l.item.mrp)}` : ""}
                      </p>
                    </div>
                    <span className="tabular shrink-0 text-sm font-semibold">{formatMoney((Number(l.item.price) * l.quantity - l.discount).toFixed(2))}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-md border">
                      <Button variant="ghost" size="icon" className="size-8" aria-label={`One less ${l.item.name}`} onClick={() => setQty(l.item.variantId, l.quantity - 1)}>
                        <Minus />
                      </Button>
                      <input aria-label={`Quantity of ${l.item.name}`} inputMode="numeric" className="tabular w-10 bg-transparent text-center text-sm outline-none" value={l.quantity} onChange={(e) => setQty(l.item.variantId, Number(e.target.value.replace(/\D/g, "")) || 0)} />
                      <Button variant="ghost" size="icon" className="size-8" aria-label={`One more ${l.item.name}`} onClick={() => setQty(l.item.variantId, l.quantity + 1)}>
                        <Plus />
                      </Button>
                    </div>
                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                      Disc. ₹
                      <input aria-label={`Discount on ${l.item.name}`} inputMode="decimal" className="tabular w-16 rounded-md border bg-transparent px-1.5 py-1 text-sm" value={l.discount || ""} onChange={(e) => setDiscount(l.item.variantId, Math.max(0, Number(e.target.value) || 0))} />
                    </label>
                    <Button variant="ghost" size="icon" className="ml-auto size-8 text-muted-foreground" aria-label={`Remove ${l.item.name}`} onClick={() => setQty(l.item.variantId, 0)}>
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              ))
            )}
          </ul>
          <div className="border-t p-4">
            <dl className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>Items</dt>
                <dd className="tabular">{count}</dd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <dt>Subtotal</dt>
                <dd className="tabular">{formatMoney(totals.subtotal.toFixed(2))}</dd>
              </div>
              {totals.discount ? (
                <div className="flex justify-between text-muted-foreground">
                  <dt>Discount</dt>
                  <dd className="tabular">−{formatMoney(totals.discount.toFixed(2))}</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-muted-foreground">
                <dt>{c.pricesIncludeTax ? "GST (included)" : "GST"}</dt>
                <dd className="tabular">{formatMoney(totals.tax.toFixed(2))}</dd>
              </div>
              <div className="mt-1 flex items-baseline justify-between border-t pt-2">
                <dt className="font-semibold">Total</dt>
                <dd className="tabular text-2xl font-bold" aria-label="Bill total">{formatMoney(totals.total.toFixed(2))}</dd>
              </div>
            </dl>
            <div className="mt-3 grid grid-cols-[auto_auto_1fr] gap-2">
              <Button variant="outline" onClick={clear} disabled={!lines.length} aria-label="Clear bill">
                <X />
              </Button>
              <Button variant="outline" onClick={() => hold.mutate()} disabled={!lines.length} loading={hold.isPending}>
                <PauseCircle /> Hold
              </Button>
              <Button size="lg" onClick={() => setPaying(true)} disabled={!lines.length}>
                Pay {formatMoney(totals.total.toFixed(2))} (F8)
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <PaymentDialog open={paying} onOpenChange={setPaying} total={totals.total} ctx={c} cashOpen={Boolean(session)} pending={sell.isPending} onPay={(t) => sell.mutate(t)} />

      <DialogRoot open={Boolean(done)} onOpenChange={(o) => { if (!o) { setDone(null); searchRef.current?.focus(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="text-success" /> Sale complete
            </DialogTitle>
            <DialogDescription>Invoice {done?.order.invoiceNumber}</DialogDescription>
          </DialogHeader>
          {done ? (
            <div className="flex flex-col gap-4">
              <dl className="grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="tabular text-right font-semibold">{formatMoney(done.order.total)}</dd>
                {done.payments.map((p) => (
                  <React.Fragment key={p.id}>
                    <dt className="text-muted-foreground capitalize">{p.provider === "razorpay" ? "UPI (Razorpay)" : p.provider}</dt>
                    <dd className="tabular text-right">{formatMoney(p.amount)}</dd>
                  </React.Fragment>
                ))}
                {Number(done.change) ? (
                  <>
                    <dt className="font-semibold">Change to give</dt>
                    <dd className="tabular text-right text-2xl font-bold" aria-label="Change to give">{formatMoney(done.change)}</dd>
                  </>
                ) : null}
              </dl>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" asChild>
                  <a href={`/print/invoice/${done.order.id}?format=receipt&autoprint=1`} target="_blank" rel="noreferrer">
                    <Printer /> Receipt
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={`/print/invoice/${done.order.id}?autoprint=1`} target="_blank" rel="noreferrer">
                    <FileText /> A4 invoice
                  </a>
                </Button>
              </div>
              <Button autoFocus onClick={() => { setDone(null); searchRef.current?.focus(); }}>
                New sale (Esc)
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </DialogRoot>

      <DialogRoot open={heldOpen} onOpenChange={setHeldOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Held sales</DialogTitle>
            <DialogDescription>Resume a parked bill. Resuming replaces the current bill.</DialogDescription>
          </DialogHeader>
          {held.data?.length ? (
            <ul className="flex flex-col gap-2">
              {held.data.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{h.label ?? "Held sale"}</p>
                    <p className="text-xs text-muted-foreground">{h.cart.items.length} line{h.cart.items.length === 1 ? "" : "s"} · {new Date(h.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <Button size="sm" onClick={() => resume.mutate(h)} loading={resume.isPending && resume.variables?.id === h.id}>
                    Resume
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Nothing on hold.</p>
          )}
        </DialogContent>
      </DialogRoot>

      {register && dialog === "open" ? <OpenRegisterDialog open onOpenChange={(o) => !o && setDialog(null)} registerId={register.id} registerName={register.name} /> : null}
      {session && dialog === "move" ? <CashMoveDialog open onOpenChange={(o) => !o && setDialog(null)} session={{ ...session, registerName: register?.name }} /> : null}
      {session && dialog === "close" ? <CloseRegisterDialog open onOpenChange={(o) => !o && setDialog(null)} session={{ ...session, registerName: register?.name }} /> : null}
    </div>
  );
}
