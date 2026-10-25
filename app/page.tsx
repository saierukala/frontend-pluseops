import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CreditCard,
  IndianRupee,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Receipt, title: "Orders", text: "Take orders from your team or your shop, reserve stock as they're placed and move them from pending to delivered." },
  { icon: Boxes, title: "Inventory", text: "Stock per warehouse, transfers, low-stock alerts and a full history of every movement." },
  { icon: Store, title: "Online store", text: "Every workspace gets a shop at /shop/<name> or its own domain. Shoppers sign up, fill a cart and check out." },
  { icon: CreditCard, title: "Payments", text: "Connect your own Razorpay account. Refunds, payment history and webhooks that mark orders paid." },
  { icon: IndianRupee, title: "Rupees and GST", text: "Prices in ₹ by default and 18% GST on every order, with a rate you can change per workspace." },
  { icon: BarChart3, title: "Analytics and reports", text: "Sales, revenue and top customers over any period, plus CSV exports now or on a schedule." },
  { icon: ShieldCheck, title: "Roles and audit", text: "Built-in and custom roles decide who can do what. Every change is recorded in the audit log." },
  { icon: Users, title: "Many businesses, one platform", text: "Each business has its own walled-off workspace. The platform team manages plans and support." },
] as const;

const STEPS = [
  { n: "1", title: "Get a workspace", text: "The platform team creates your business and its first admin." },
  { n: "2", title: "Add your catalog", text: "Products, variants and stock in your warehouses." },
  { n: "3", title: "Sell", text: "Staff create orders, or shoppers buy from your online store." },
  { n: "4", title: "Track", text: "Payments, fulfilment, analytics and reports in one place." },
] as const;

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container-pulse mx-auto flex h-16 max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground" aria-hidden>
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 12h6l2-6 4 12 2-6h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-base font-semibold tracking-tight">PulseOps</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/store">Visit a store</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />
          <div className="container-pulse relative mx-auto flex max-w-6xl flex-col items-center gap-6 py-20 text-center sm:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
              <ShoppingBag className="size-3.5 text-primary" /> Orders, stock, payments and your online store
            </span>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Run your whole business from <span className="text-primary">one place</span>
            </h1>
            <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
              PulseOps keeps orders, inventory, customers, payments and your online shop in sync, priced in rupees with GST worked out for you.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/login">
                  Sign in <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/store">Open a store</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container-pulse mx-auto max-w-6xl py-16 sm:py-20">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Everything a growing shop needs</h2>
            <p className="mt-2 text-muted-foreground">One sign-in for your whole team. Each person sees what their role allows.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-5 shadow-xs transition-shadow hover:shadow-md">
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <f.icon className="size-4.5" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/40">
          <div className="container-pulse mx-auto max-w-6xl py-16 sm:py-20">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{s.n}</span>
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="container-pulse mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 py-8 text-sm text-muted-foreground sm:flex-row">
        <span>© {new Date().getFullYear()} PulseOps</span>
        <span>Made for Indian businesses · Prices in ₹ with GST</span>
      </footer>
    </div>
  );
}
