# PulseOps Design System — F02

**Status:** IMPLEMENTED — AUTOMATED VERIFIED — AWAITING HUMAN VERIFICATION  
**Route:** `/design-system`  
**Tokens source:** `app/globals.css` + `src/config/tokens.ts`  
**Showcase:** `app/design-system/client.tsx`

---

## 1. Objective

Build the complete reusable PulseOps UI Design System before implementing large application modules (F03+). Every future feature must consume these primitives instead of inventing its own button/card/table styles.

Principles: reusable, consistent, accessible, responsive, production-quality, compatible with F01 foundation.

---

## 2. Foundation

All foundations are single-source via CSS variables. No random colors.

| Area | Tokens | Usage |
|------|--------|-------|
| **Colors** | `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--primary-hover`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--chart-{1..5}`, `--sidebar-*` | via `var(--...)` and `@theme inline --color-*` |
| **Spacing** | `--spacing-xs|sm|md|lg|xl|2xl` (4px base) + Tailwind defaults | gap, padding, margin |
| **Radius** | `--radius` (0.625rem) → `--radius-sm|md|lg|xl` + `full` | cards, inputs, badges |
| **Shadows** | `--shadow-xs|sm|md|lg` | cards, popovers, dialogs |
| **Typography** | `--font-sans` (Geist Sans), `--font-mono` (Geist Mono), Tailwind `text-*` | `src/components/ui/typography.tsx` helpers |
| **Surfaces** | `bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `bg-primary` | cards, tables, dialogs |
| **Borders** | `border`, `border-input`, `ring` | consistent 1px borders |

**Typography helpers** (`src/components/ui/typography.tsx:1`): `Display`, `H1`, `H2`, `H3`, `H4`, `Lead`, `Body`, `Small`, `Muted`, `Code`.

**Dark mode:** `prefers-color-scheme` media query in `globals.css:118`. No JS toggle required for F02; components use `dark:` variants.

**Reduced motion:** `motion-reduce:transition-none` / `motion-reduce:animate-none` on animated elements.

---

## 3. Architecture & Locations

```
src/
├── lib/utils.ts                    cn() + format helpers
├── config/tokens.ts                JS mirror of CSS variables
├── components/
│   ├── ui/                         Canonical primitives (import here)
│   │   ├── button.tsx              Button, ButtonVariant/Size
│   │   ├── icon-button.tsx         IconButton (a11y label required)
│   │   ├── input.tsx               Input with error/left/right
│   │   ├── textarea.tsx            Textarea
│   │   ├── select.tsx              Select (native, styled)
│   │   ├── combobox.tsx            Combobox with search + empty state
│   │   ├── date-picker.tsx         DatePicker + DateRangePicker
│   │   ├── checkbox.tsx            Checkbox with label/description
│   │   ├── radio.tsx               Radio + RadioGroup
│   │   ├── switch.tsx              Switch (role=switch)
│   │   ├── badge.tsx               Badge variants
│   │   ├── avatar.tsx              Avatar with status dot
│   │   ├── tooltip.tsx             Tooltip (hover/focus, delay)
│   │   ├── dropdown.tsx            Dropdown menu (separator/label/item)
│   │   ├── tabs.tsx                Tabs (underline|pill, keyboard arrow nav)
│   │   ├── card.tsx                Card, CardHeader/Title/Description/Content/Footer
│   │   ├── modal.tsx               Modal (overlay+Esc)
│   │   ├── drawer.tsx              Drawer (right/left/bottom, sizes)
│   │   ├── dialog.tsx              Dialog (confirm/cancel, destructive)
│   │   ├── alert.tsx               Alert (info/success/warning/destructive)
│   │   ├── breadcrumb.tsx          Breadcrumb (Link aware)
│   │   ├── pagination.tsx          Pagination (summary + ellipsis)
│   │   ├── skeleton.tsx            Skeleton, SkeletonText, SkeletonTable
│   │   ├── empty-state.tsx         EmptyState (icon/title/action)
│   │   ├── error-state.tsx         ErrorState (retry/requestId)
│   │   ├── stat-card.tsx           StatCard (label/value/trend)
│   │   ├── data-table.tsx          DataTable (sort, pagination, sticky header, mobile scroll)
│   │   ├── filter-bar.tsx          FilterBar (grid of Selects)
│   │   ├── search-bar.tsx          SearchBar (debounce, loading, clearable)
│   │   ├── command-menu.tsx        CommandMenu (groups, keyboard nav)
│   │   ├── typography.tsx          Helpers above
│   │   └── index.ts                Barrel
│   ├── forms/index.ts              Re-export for @/components/forms
│   ├── tables/index.ts             Re-export for @/components/tables
│   ├── feedback/
│   │   ├── toast.tsx               ToastProvider, useToast, variants
│   │   └── index.ts                Re-export
│   ├── charts/index.ts             Placeholder (arch compliance)
│   ├── display/                    Data/product display (storefront + admin)
│   │   ├── metric-card.tsx         MetricCard (large KPI)
│   │   ├── status-badge.tsx        StatusBadge (maps order/inventory states → Badge)
│   │   ├── money-display.tsx       MoneyDisplay (Intl currency)
│   │   ├── date-display.tsx        DateDisplay (Intl + relative)
│   │   ├── quantity-display.tsx    QuantityDisplay
│   │   ├── trend-indicator.tsx     TrendIndicator
│   │   ├── activity-item.tsx       ActivityItem (avatar+action+time)
│   │   ├── timeline.tsx            Timeline (vertical/horizontal)
│   │   ├── order-status-stepper.tsx OrderStatusStepper (PENDING→DELIVERED)
│   │   ├── product-card.tsx        ProductCard
│   │   ├── product-grid.tsx        ProductGrid (2/3/4 cols, empty/loading)
│   │   └── index.ts
│   └── ui/ + display are canonical; forms/tables/feedback/charts re-export for roadmap compliance
```

**Import convention for F03+:**

```ts
import { Button, Card, DataTable } from "@/components/ui";
import { Input, Select } from "@/components/forms";
import { DataTable } from "@/components/tables";
import { ToastProvider, useToast } from "@/components/feedback";
import { StatusBadge, MoneyDisplay } from "@/components/display";
```

Feature modules MUST NOT create `features/*/components/Button.tsx`. If a needed variant is missing, extend the design system.

---

## 4. Component Inventory & Props

### 4.1 Button (`components/ui/button.tsx:1`)
- Variants: `primary` | `secondary` | `outline` | `ghost` | `destructive` | `link`
- Sizes: `sm` | `md` | `lg` | `icon`
- Props: `loading` (spinner + aria-busy), `leftIcon`, `rightIcon`, `disabled`, all button attrs
- A11y: focus-visible ring, disabled → `aria-disabled`, loading → `aria-busy`, active scale, reduced-motion

### 4.2 IconButton (`icon-button.tsx:1`)
- Requires `aria-label`, wraps Button with `size` sm|md|lg

### 4.3 Input / Textarea (`input.tsx:1`, `textarea.tsx:1`)
- `error` string → `aria-invalid` + `role=alert` message, `leftElement`/`rightElement`, focus ring

### 4.4 Select (`select.tsx:1`)
- `options: SelectOption[]`, `placeholder`, `error`, `onValueChange`

### 4.5 Combobox (`combobox.tsx:1`)
- `options`, `value`, `onValueChange`, `placeholder`, `searchPlaceholder`, `emptyText`, `error`, searchable listbox, Esc + click-outside closes

### 4.6 DatePicker / DateRangePicker (`date-picker.tsx:1`)
- Single `type=date` styled; range composes two pickers with `from`/`to`

### 4.7 Checkbox / Radio / Switch
- Checkbox: `label`, `description`, `error`
- Radio: `Radio` + `RadioGroup` (`options`, `value`, `onValueChange`, `orientation`)
- Switch: `role=switch`, `aria-checked`, `size` sm|md, `label`/`description`

### 4.8 Badge (`badge.tsx:1`)
- Variants: `default|secondary|outline|success|warning|destructive|info`, sizes `sm|md`, `dot`

### 4.9 Avatar (`avatar.tsx:1`)
- `src`, `alt`, `fallback`, `size` sm|md|lg|xl, `status` online|offline|busy|away with dot

### 4.10 Tooltip (`tooltip.tsx:1`)
- `content`, `side` top|bottom|left|right, `delay`, clones child to set `aria-describedby`

### 4.11 Dropdown (`dropdown.tsx:1`)
- `trigger`, `items` (item|separator|label), `align`, hover/active, destructive, shortcut, `role=menu/menuitem`

### 4.12 Tabs (`tabs.tsx:1`)
- `items: {value,label,icon,disabled,badge}`, `value/defaultValue/onValueChange`, variants `underline|pill`, arrow-key navigation

### 4.13 Card (`card.tsx:1`)
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `interactive` hover

### 4.14 Modal / Drawer / Dialog
- Modal: `open/onOpenChange`, `title/description`, `size` sm|md|lg|xl|full, Esc + overlay close, body scroll lock
- Drawer: `side` right|left|bottom, `size` sm|md|lg
- Dialog: `title` required, `confirmLabel/cancelLabel`, `variant` default|destructive, `loading`, `role=alertdialog`

### 4.15 Toast (`feedback/toast.tsx:1`)
- `ToastProvider` + `useToast()` → `{ toast, dismiss, success, error, info }`, `ToastItem {id,title,description,variant,duration}`, viewport bottom-right, dismiss button, auto-dismiss, `aria-live=polite`

### 4.16 Alert (`alert.tsx:1`)
- Variants `default|info|success|warning|destructive`, `title`, `icon`, `dismissible`

### 4.17 Breadcrumb (`breadcrumb.tsx:1`)
- `items: {label,href?}`, last = `aria-current=page`, separator slot

### 4.18 Pagination (`pagination.tsx:1`)
- `page`, `pageSize`, `total`, `onPageChange`, `siblingCount`, `showSummary`, ellipsis algorithm

### 4.19 Skeleton / EmptyState / ErrorState
- Skeleton: variants `block|text|circle|card`, plus `SkeletonText`, `SkeletonTable`
- EmptyState: `title`, `description`, `icon`, `actionLabel/onAction`, `variant` card|default
- ErrorState: `title/description/requestId/onRetry/onReset`, `role=alert`

### 4.20 StatCard (`stat-card.tsx:1`)
- `label`, `value`, `hint`, `icon`, `trend {value,direction,label}`, `loading`

### 4.21 DataTable (`data-table.tsx:1`)
- `columns: Column<T>[] {key,header,width,align,sortable,render,accessor}`, `data`, `loading`, `empty*`, `sortKey/sortDirection/onSort`, `getRowId`, `onRowClick` (keyboard Enter/Space), `pagination` (uses Pagination), `stickyHeader`, overflow-x-auto (responsive), no layout break

### 4.22 FilterBar (`filter-bar.tsx:1`)
- `filters: FilterDefinition[]`, `onClear/onApply`, `activeCount`, `collapsible`

### 4.23 SearchBar (`search-bar.tsx:1`)
- `value/onValueChange/onSearch`, `debounceMs` (default 300), `loading`, `clearable`, focus-within ring

### 4.24 CommandMenu (`command-menu.tsx:1`)
- `open/onOpenChange`, `groups: CommandGroup[]`, keyboard ArrowUp/Down + Enter, `⌘K` hint, Esc + overlay close

### 4.25 Display primitives (`components/display/*`)
- **MetricCard** — large KPI (`label,value,subValue,icon,trend,footer`)
- **StatusBadge** — maps `StatusKind` (pending/confirmed/processing/shipped/delivered/cancelled/... low_stock/out_of_stock/draft/published/archived) → Badge variant, fallback humanized
- **MoneyDisplay** — `amount,currency,locale,compact,showCurrency,size,align` via `Intl.NumberFormat` / `formatCurrency`
- **DateDisplay** — `value,format,locale,relative,prefix`, renders `<time dateTime>`
- **QuantityDisplay** — `value,unit,size,status` (low/out/high)
- **TrendIndicator** — `value,direction,label,size`
- **ActivityItem** — `actor{name,avatar},action,target,timestamp,icon,description`
- **Timeline** — `items: {id,title,description,timestamp,icon,status:completed|current|upcoming|error}`, orientations vertical/horizontal
- **OrderStatusStepper** — `current: OrderStatus`, `statuses`, variants horizontal/vertical, `aria-current=step`
- **ProductCard** — `image,title,sku,price,compareAtPrice,currency,status,stockLabel,rating,onAddToCart,onView,loading,compact`
- **ProductGrid** — `products,loading,loadingCount,emptyTitle/Description,columns 2|3|4`

---

## 5. Accessibility

- Semantic HTML: `<button>`, `<nav aria-label>`, `<table>` with `<th aria-sort>`, `<time>`, `<role=alert|status|dialog|menu|tablist|radiogroup>`
- Visible focus: `:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px }` + `focus-visible:ring-2` utilities
- Keyboard: Tab order, Enter/Space to activate rows/tabs, Arrow keys for Tabs and CommandMenu, Esc closes overlays, overlay click closes, focus management (modal/drawer trap via Esc)
- Disabled/loading: `disabled` + `aria-disabled`, `aria-busy`, `opacity-60`, `cursor-not-allowed`, `sr-only` for hidden inputs
- Labels: `label htmlFor`, `aria-label`, `aria-describedby` for errors, `aria-invalid`, `aria-current`, `aria-selected`, `aria-expanded/hasPopup`
- Screen reader: alerts use `role=alert`, toasts `role=status` + `aria-live=polite`, reduced-motion respected

---

## 6. Responsive & Dark Mode

- Responsive: Tailwind breakpoints `sm:md:lg:xl`, tables `overflow-x-auto`, grids `grid-cols-1 sm:grid-cols-2 lg:grid-cols-*`, Pagination collapses to “Page X of Y” on mobile (`sm:hidden`), CommandMenu/Modal/Drawer fluid
- Dark mode: `prefers-color-scheme: dark` variables + `dark:` utilities; verify by toggling OS dark mode or DevTools rendering emulation
- Spacing: consistent `gap-3 p-4` / `p-5` for cards, `gap-1.5` for form fields
- Shadows and radius from tokens, not arbitrary values
- Performance: no heavy deps, pure React + Tailwind, `lazy` images in ProductCard

---

## 7. Usage Examples

```tsx
// Button variants
<Button variant="primary" size="md" loading={isSaving} leftIcon={<Plus />}>Save</Button>
<IconButton aria-label="Notifications" variant="ghost"><Bell /></IconButton>

// Forms
<Input error="Required" leftElement={<Mail />} />
<Select options={statusOpts} onValueChange={setStatus} />
<Combobox options={warehouses} value={wh} onValueChange={setWh} />
<DatePicker value={d} onValueChange={setD} label="Start" />
<Checkbox label="Notify" description="Email updates" />
<RadioGroup name="role" options={roles} value={v} onValueChange={setV} />
<Switch label="Realtime" checked={on} onChange={e=>setOn(e.target.checked)} />

// Feedback
const { success } = useToast();
success("Saved");

// Data
<DataTable columns={cols} data={rows} pagination={{page,pageSize,total,onPageChange}} />
<FilterBar filters={filters} onClear={clear} activeCount={n} />
<SearchBar value={q} onValueChange={setQ} onSearch={doSearch} debounceMs={300} />

// Display
<StatusBadge status="shipped" />
<MoneyDisplay amount={1299} currency="INR" />
<DateDisplay value={order.createdAt} relative />
<ProductGrid products={products} columns={4} />

// Overlays
<Modal open={open} onOpenChange={setOpen} title="Edit"><Form /></Modal>
<Dialog open={open} onOpenChange={setOpen} title="Delete?" variant="destructive" onConfirm={del} />
```

---

## 8. Conventions for F03+

1. **Do not invent styles.** Import from `@/components/ui` etc. If a style is missing, PR the design system.
2. **Use tokens.** Never hardcode `#rrggbb` outside tokens; use `bg-primary`, `text-muted-foreground`, `border-input`, `shadow-xs`.
3. **Keep pages thin.** Feature code lives in `src/features/*`; pages compose design-system primitives.
4. **Forms are local.** Validation in `lib/validation`, but form UI stays on design-system components.
5. **Tables are design-system.** No custom `<table>` in features; use `DataTable` with `Column<T>`.
6. **Feedback is unified.** Always use `useToast()` and `Alert`/`EmptyState`/`ErrorState`; no `alert()` or raw divs.
7. **No backend faking.** Design system has zero API calls; it is UI infrastructure only.
8. **A11y is required.** All interactive elements need keyboard, focus, and aria semantics (check before merge).
9. **Responsive is required.** Tables must scroll, grids must reflow, dialogs must be viewport-aware.

---

## 9. Verification

- `npm run lint` — clean (warnings about unused disable directives only, now resolved)
- `npm run typecheck` — pass
- `npm run build` — pass (routes: `/` + `/design-system` static)
- Manual checklist at `/design-system`: buttons, inputs, selects, pickers, checkboxes, radios, switches, badges, avatars, tooltips, dropdowns, tabs, cards, alerts, modals/drawers/dialogs (Esc+overlay), breadcrumbs, pagination, skeletons, empty/error, stat/metric, tables, filter/search, command menu (⌘K), money/date/quantity/trend, activity/timeline/stepper, product grid — responsive, dark, reduced-motion, no console errors.

---

## 10. Known Limitations / Next Steps

- Charts barrel is placeholder — real charts arrive in F09/F23 (Recharts or similar, tokens `--chart-1..5` already reserved)
- No font-size switcher / theme toggle beyond `prefers-color-scheme` — intentional for F02
- DatePicker is native `<input type=date>` styled, not a calendar popup — keeps dependencies minimal; calendar can be added without API break
- Toast currently in-memory, no persistence or queue limit — sufficient for F02; realtime will reuse it in F22
- `DataTable` does not yet virtualize — add virtualization in F37 Performance if rows > 500

---

*Document for human verification gate. Do not start F03 until this phase is APPROVED.*
