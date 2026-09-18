"use client";

import * as React from "react";

// Fixed demo timestamps to avoid hydration mismatch (server vs client Date.now drift)
const DEMO_RELATIVE_45M = "2026-09-18T11:15:00.000Z";
const DEMO_RELATIVE_12M = "2026-09-18T11:48:00.000Z";
const DEMO_RELATIVE_3H = "2026-09-18T09:00:00.000Z";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker, DateRangePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup } from "@/components/ui/radio";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { Dropdown } from "@/components/ui/dropdown";
import { Tabs } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Drawer } from "@/components/ui/drawer";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { SearchBar } from "@/components/ui/search-bar";
import { CommandMenu } from "@/components/ui/command-menu";
import { MetricCard } from "@/components/display/metric-card";
import { StatusBadge } from "@/components/display/status-badge";
import { MoneyDisplay } from "@/components/display/money-display";
import { DateDisplay } from "@/components/display/date-display";
import { QuantityDisplay } from "@/components/display/quantity-display";
import { TrendIndicator } from "@/components/display/trend-indicator";
import { ActivityItem } from "@/components/display/activity-item";
import { Timeline } from "@/components/display/timeline";
import { OrderStatusStepper } from "@/components/display/order-status-stepper";
import { ProductGrid } from "@/components/display/product-grid";
import { ToastProvider, useToast } from "@/components/feedback/toast";
import { H2, H3, Small } from "@/components/ui/typography";

type Row = { id: string; name: string; sku: string; price: number; stock: number; status: string };

const sampleRows: Row[] = [
  { id: "1", name: "Wireless Headphones", sku: "WH-001", price: 2999, stock: 42, status: "in_stock" },
  { id: "2", name: "Mechanical Keyboard", sku: "MK-002", price: 7499, stock: 3, status: "low_stock" },
  { id: "3", name: "4K Monitor 27 inch", sku: "MN-003", price: 24999, stock: 0, status: "out_of_stock" },
  { id: "4", name: "USB-C Hub", sku: "UH-004", price: 1499, stock: 120, status: "in_stock" },
];

function ShowcaseInner() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [comboValue, setComboValue] = React.useState("wh");
  const [date, setDate] = React.useState("2026-03-15");
  const [rangeFrom, setRangeFrom] = React.useState("2026-03-01");
  const [rangeTo, setRangeTo] = React.useState("2026-03-31");
  const [checkbox, setCheckbox] = React.useState(true);
  const [radio, setRadio] = React.useState("pro");
  const [switchOn, setSwitchOn] = React.useState(true);
  const [selectVal, setSelectVal] = React.useState("active");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [activeTab, setActiveTab] = React.useState("overview");
  const toast = useToast();

  const columns: Column<Row>[] = [
    { key: "name", header: "Product", sortable: true, render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "sku", header: "SKU", render: (r) => <span className="font-mono text-xs">{r.sku}</span> },
    { key: "price", header: "Price", align: "right", sortable: true, render: (r) => <MoneyDisplay amount={r.price} size="sm" /> },
    { key: "stock", header: "Stock", align: "center", render: (r) => <QuantityDisplay value={r.stock} status={r.stock === 0 ? "out" : r.stock < 10 ? "low" : "default"} /> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container-pulse flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 12h6l2-6 4 12 2-6h4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-sm font-semibold">PulseOps</span>
            </Link>
            <span className="rounded-full border bg-muted px-2.5 py-1 text-xs font-medium">F02 Design System</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setCmdOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              Command ⌘K
            </Button>
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <main className="container-pulse py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">PulseOps Design System</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            F02 — Reusable primitives covering foundations, core UI, navigation, data display, and product primitives.
            All tokens derive from <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">globals.css</code> and{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">src/config/tokens.ts</code>. Future modules must import from
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">@/components/ui</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">@/components/forms</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">@/components/tables</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">@/components/feedback</code>.
          </p>
          <Breadcrumb
            className="mt-4"
            items={[{ label: "Home", href: "/" }, { label: "Design System" }]}
          />
        </div>

        {/* Visual hint */}
        <Alert variant="info" title="How to verify" className="mb-8">
          Check keyboard focus (Tab), disabled/loading states, hover/active, dark mode (system), responsive wrapping, dialogs/drawers close via Esc/overlay, tables don’t break layout, toasts dismiss.
        </Alert>

        {/* Foundation */}
        <section className="mb-10">
          <H2 className="mb-4">Foundation</H2>
          <div className="grid gap-4 md:grid-cols-3 min-w-0">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>Geist Sans / Mono via F01</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-bold">Display 4xl/5xl</p>
                <p className="text-lg font-semibold">H2 Semibold</p>
                <p className="text-sm text-muted-foreground">Body small, muted, readable.</p>
                <p className="font-mono text-xs">Mono code 0x PulseOps</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Surfaces & Borders</CardTitle>
                <CardDescription>background, card, popover, border, input, ring</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-xs">
                <span className="rounded-lg border bg-card p-3">card</span>
                <span className="rounded-lg border bg-popover p-3">popover</span>
                <span className="rounded-lg bg-muted p-3">muted</span>
                <span className="rounded-lg bg-primary p-3 text-primary-foreground">primary</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Radius & Shadows</CardTitle>
                <CardDescription>xs sm md lg, radius-* from --radius</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <span className="h-16 w-16 rounded-sm border bg-card shadow-xs" />
                <span className="h-16 w-16 rounded-md border bg-card shadow-sm" />
                <span className="h-16 w-16 rounded-lg border bg-card shadow-md" />
                <span className="h-16 w-16 rounded-xl border bg-card shadow-lg" />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-10">
          <H2 className="mb-4">Buttons</H2>
          <Card>
            <CardContent className="flex flex-wrap gap-3 pt-6">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <IconButton aria-label="Notifications" variant="outline">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7-6 5-6 9a2 2 0 0 1-4 0c0-4-6-2-6-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </IconButton>
            </CardContent>
          </Card>
        </section>

        {/* Forms */}
        <section className="mb-10 min-w-0">
          <H2 className="mb-4">Forms</H2>
          <div className="grid gap-4 md:grid-cols-2 min-w-0">
            <Card className="min-w-0 w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Email address" id="ex-input" />
                <Input placeholder="Search products" leftElement={<span>🔍</span>} value={search} onChange={(e) => setSearch(e.target.value)} />
                <Input placeholder="Error state" error="This field is required" id="ex-error" />
                <Input placeholder="Disabled" disabled />
                <Textarea placeholder="Description…" />
                <Textarea placeholder="Error textarea" error="Too short" />
              </CardContent>
            </Card>
            <Card className="min-w-0 w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Selects & Pickers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  options={[
                    { value: "active", label: "Active" },
                    { value: "draft", label: "Draft" },
                    { value: "archived", label: "Archived" },
                  ]}
                  value={selectVal}
                  onValueChange={setSelectVal}
                  placeholder="Status"
                />
                <Select options={[{ value: "1", label: "Option 1" }]} error="Required" placeholder="With error" />
                <Combobox
                  options={[
                    { value: "wh", label: "Warehouse — Mumbai" },
                    { value: "del", label: "Warehouse — Delhi" },
                    { value: "blr", label: "Warehouse — Bengaluru" },
                  ]}
                  value={comboValue}
                  onValueChange={setComboValue}
                  placeholder="Choose warehouse"
                />
                <DatePicker value={date} onValueChange={setDate} label="Date" />
                <DateRangePicker from={rangeFrom} to={rangeTo} onFromChange={setRangeFrom} onToChange={setRangeTo} label="Range" />
                <div className="flex flex-wrap gap-4">
                  <Checkbox label="Notify me" description="Send email on update" checked={checkbox} onChange={(e) => setCheckbox(e.target.checked)} />
                  <Switch label="Enable realtime" checked={switchOn} onChange={(e) => setSwitchOn(e.target.checked)} />
                </div>
                <RadioGroup
                  name="plan"
                  value={radio}
                  onValueChange={setRadio}
                  options={[
                    { value: "free", label: "Free", description: "Up to 100 orders" },
                    { value: "pro", label: "Pro", description: "Unlimited" },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Core display */}
        <section className="mb-10 min-w-0">
          <H2 className="mb-4">Core display</H2>
          <div className="grid gap-4 md:grid-cols-2 min-w-0">
            <Card>
              <CardHeader>
                <CardTitle>Badges, Avatars, Tooltips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="destructive">Failed</Badge>
                  <Badge variant="info">Info</Badge>
                  <StatusBadge status="pending" />
                  <StatusBadge status="shipped" />
                  <StatusBadge status="delivered" />
                  <StatusBadge status="low_stock" />
                </div>
                <div className="flex items-center gap-3">
                  <Avatar fallback="AO" size="sm" />
                  <Avatar fallback="PulseOps" size="md" status="online" />
                  <Avatar fallback="JD" size="lg" status="busy" />
                </div>
                <div className="flex gap-3">
                  <Tooltip content="Save changes">
                    <Button variant="outline" size="sm">
                      Hover me
                    </Button>
                  </Tooltip>
                  <Dropdown
                    trigger={<Button variant="outline" size="sm">Open menu</Button>}
                    items={[
                      { label: "View", icon: <span>👁</span>, onSelect: () => toast.toast({ title: "View clicked" }) },
                      { label: "Edit" },
                      { type: "separator" },
                      { label: "Delete", destructive: true },
                    ]}
                  />
                </div>
                <Tabs
                  items={[
                    { value: "overview", label: "Overview" },
                    { value: "orders", label: "Orders", badge: 12 },
                    { value: "settings", label: "Settings" },
                  ]}
                  value={activeTab}
                  onValueChange={setActiveTab}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cards & Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle>Nested card</CardTitle>
                    <CardDescription>Card supports header, content, footer.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Small>Content projects onto card surface with --card tokens.</Small>
                  </CardContent>
                </Card>
                <Alert variant="success" title="Payment confirmed">
                  Order #4821 was processed successfully.
                </Alert>
                <Alert variant="warning" title="Low inventory">
                  3 SKUs below threshold. Review inventory center.
                </Alert>
                <Alert variant="destructive" title="Failed to load">
                  Request failed — check connection and try again.
                </Alert>
                <Alert variant="info" title="Info">
                  New feature: realtime inventory updates via Socket.IO.
                </Alert>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Overlays */}
        <section className="mb-10">
          <H2 className="mb-4">Overlays</H2>
          <Card>
            <CardContent className="flex flex-wrap gap-3 pt-6">
              <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
              <Button variant="outline" onClick={() => setDrawerOpen(true)}>
                Open Drawer
              </Button>
              <Button variant="secondary" onClick={() => setDialogOpen(true)}>
                Open Dialog
              </Button>
              <Button variant="ghost" onClick={() => toast.success("Saved", "Your changes are saved.")}>
                Toast success
              </Button>
              <Button variant="ghost" onClick={() => toast.error("Error", "Something went wrong.")}>
                Toast error
              </Button>
            </CardContent>
          </Card>
          <Modal open={modalOpen} onOpenChange={setModalOpen} title="Modal example" description="Accessible modal with focus trap via Esc and overlay click.">
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">This is a generic modal container for forms or details.</p>
              <div className="flex gap-2">
                <Button onClick={() => setModalOpen(false)}>Close</Button>
                <Button variant="outline" onClick={() => toast.toast({ title: "Action in modal" })}>
                  Action
                </Button>
              </div>
            </div>
          </Modal>
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Drawer" description="Slide-over for detail views, audit, history.">
            <p className="text-sm text-muted-foreground">Drawer content area. Test keyboard Esc and overlay dismiss.</p>
            <div className="mt-4">
              <Button onClick={() => setDrawerOpen(false)}>Close</Button>
            </div>
          </Drawer>
          <Dialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            title="Delete product?"
            description="This action cannot be undone. The product will be removed from the catalog."
            confirmLabel="Delete"
            variant="destructive"
            onConfirm={() => {
              toast.toast({ title: "Deleted (mock) — no backend call" });
              setDialogOpen(false);
            }}
          />
        </section>

        {/* Navigation */}
        <section className="mb-10 min-w-0">
          <H2 className="mb-4">Navigation</H2>
          <div className="grid gap-4 md:grid-cols-2 min-w-0">
            <Card>
              <CardHeader>
                <CardTitle>Breadcrumb</CardTitle>
              </CardHeader>
              <CardContent>
                <Breadcrumb
                  items={[
                    { label: "Dashboard", href: "/" },
                    { label: "Catalog", href: "#" },
                    { label: "Products" },
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pagination</CardTitle>
              </CardHeader>
              <CardContent>
                <Pagination page={page} pageSize={10} total={96} onPageChange={setPage} />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feedback / empty / skeleton */}
        <section className="mb-10 min-w-0">
          <H2 className="mb-4">Feedback & loading</H2>
          <div className="grid gap-4 md:grid-cols-3 min-w-0">
            <Card>
              <CardHeader>
                <CardTitle>Skeletons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-20 w-full" variant="card" />
                <SkeletonTable rows={2} cols={3} />
              </CardContent>
            </Card>
            <EmptyState
              title="No products yet"
              description="Add your first product to start building your catalog."
              actionLabel="Add Product"
              onAction={() => toast.toast({ title: "Add Product (mock)" })}
            />
            <ErrorState
              title="We couldn't load products"
              description="Please try again. If the issue persists, contact support."
              requestId="req_abc123"
              onRetry={() => toast.toast({ title: "Retrying…" })}
            />
          </div>
        </section>

        {/* Data */}
        <section className="mb-10 min-w-0">
          <H2 className="mb-4">Data — Stat, Metric, Table, Filter, Search</H2>
          <div className="grid gap-4 md:grid-cols-3 mb-4 min-w-0">
            <StatCard label="Revenue" value={<MoneyDisplay amount={284500} />} hint="Last 30 days" trend={{ value: "+12.4%", direction: "up", label: "vs prev" }} />
            <StatCard label="Orders" value="1,284" hint="Total orders" trend={{ value: "-3.2%", direction: "down", label: "vs prev" }} />
            <MetricCard
              label="Active products"
              value="342"
              subValue="12 drafts"
              trend={{ value: "+8", direction: "up", hint: "this week" }}
              footer={<span>View catalog →</span>}
            />
          </div>
          <div className="grid gap-4 min-w-0">
            <SearchBar value={search} onValueChange={setSearch} placeholder="Search products…" />
            <FilterBar
              filters={[
                { key: "status", label: "Status", options: [{ value: "active", label: "Active" }, { value: "draft", label: "Draft" }], value: "" },
                { key: "category", label: "Category", options: [{ value: "electronics", label: "Electronics" }] },
                { key: "stock", label: "Stock", options: [{ value: "in", label: "In stock" }, { value: "low", label: "Low" }] },
                { key: "price", label: "Price", options: [{ value: "0-1000", label: "₹0–1,000" }] },
              ]}
              onClear={() => toast.toast({ title: "Filters cleared" })}
              activeCount={0}
            />
            <DataTable<Row>
              columns={columns}
              data={sampleRows}
              getRowId={(r) => r.id}
              pagination={{ page, pageSize: 10, total: 96, onPageChange: setPage }}
              onSort={() => toast.toast({ title: "Sort (mock)" })}
              sortKey="name"
              sortDirection="asc"
            />
          </div>
        </section>

        {/* Command + money/date/quantity/trend */}
        <section className="mb-10">
          <H3 className="mb-3">Command menu & value displays</H3>
          <Card>
            <CardContent className="flex flex-wrap gap-6 pt-6 text-sm">
              <span className="inline-flex items-center gap-2">
                <MoneyDisplay amount={1299.5} />
                <Small>MoneyDisplay</Small>
              </span>
              <span className="inline-flex items-center gap-2">
                <DateDisplay value="2026-03-15T10:00:00Z" />
                <Small>•</Small>
                <DateDisplay value={DEMO_RELATIVE_45M} relative />
              </span>
              <QuantityDisplay value={42} unit="units" />
              <TrendIndicator value={12.4} direction="up" label="vs last week" />
              <TrendIndicator value={-3.1} direction="down" />
              <TrendIndicator value="—" direction="neutral" label="no change" />
            </CardContent>
          </Card>
        </section>

        {/* Timeline / activity / stepper */}
        <section className="mb-10 grid gap-4 md:grid-cols-2 min-w-0">
          <Card className="min-w-0 w-full overflow-hidden">
            <CardHeader>
              <CardTitle>Activity & Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ActivityItem
                actor={{ name: "Aarav Shah" }}
                action="updated inventory for"
                target="Wireless Headphones"
                timestamp={DEMO_RELATIVE_12M}
                description="Adjusted quantity from 42 → 38 (sale)"
              />
              <ActivityItem
                actor={{ name: "System" }}
                action="triggered low-stock alert for"
                target="Mechanical Keyboard"
                timestamp={DEMO_RELATIVE_3H}
              />
              <Timeline
                items={[
                  { id: "1", title: "Order placed", description: "Customer placed order #3821", status: "completed" },
                  { id: "2", title: "Confirmed", description: "Payment verified", status: "completed" },
                  { id: "3", title: "Shipped", description: "Out for delivery", status: "current" },
                  { id: "4", title: "Delivered", status: "upcoming" },
                ]}
              />
            </CardContent>
          </Card>
          <Card className="min-w-0 w-full overflow-hidden">
            <CardHeader>
              <CardTitle>Order status stepper</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <OrderStatusStepper current="PROCESSING" />
              <OrderStatusStepper current="SHIPPED" variant="vertical" />
            </CardContent>
          </Card>
        </section>

        {/* Product grid */}
        <section className="mb-10">
          <H2 className="mb-4">Product primitives</H2>
          <ProductGrid
            products={[
              { id: "1", title: "Wireless Headphones — Noise cancelling", sku: "WH-001", price: 2999, compareAtPrice: 3999, status: "published", stockLabel: "In stock", rating: 4.7 },
              { id: "2", title: "Mechanical Keyboard RGB", sku: "MK-002", price: 7499, status: "published", stockLabel: "Low stock" },
              { id: "3", title: "4K Monitor 27 inch", sku: "MN-003", price: 24999, status: "draft", stockLabel: "Out of stock" },
              { id: "4", title: "USB-C Hub 6-in-1", sku: "UH-004", price: 1499, status: "published", stockLabel: "In stock" },
            ]}
          />
        </section>

        <div className="rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground">
          <p>
            All components use F01 tokens (--primary, --border, --radius, --shadow, etc.) and support keyboard navigation,
            focus-visible, disabled/loading/error states, ARIA, responsive breakpoints, dark mode via prefers-color-scheme,
            and reduced-motion. Showcase: <code className="font-mono">app/design-system/client.tsx</code>. Docs:{" "}
            <code className="font-mono">docs/DESIGN_SYSTEM.md</code>.
          </p>
        </div>
      </main>

      <CommandMenu
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        groups={[
          {
            heading: "Navigation",
            items: [
              { id: "home", label: "Go to Home", description: "Back to foundation page", onSelect: () => router.push("/") },
              { id: "ds", label: "Design System", description: "Current page", onSelect: () => {} },
            ],
          },
          {
            heading: "Actions",
            items: [
              { id: "toast", label: "Show toast", onSelect: () => toast.success("Command executed") },
              { id: "modal", label: "Open modal", onSelect: () => setModalOpen(true) },
            ],
          },
        ]}
      />
    </div>
  );
}

export default function DesignSystemClient() {
  return (
    <ToastProvider>
      <ShowcaseInner />
    </ToastProvider>
  );
}
