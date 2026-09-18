/**
 * PulseOps Design System — UI barrel
 * F02: reusable primitives. Future modules must import from here, not invent styles.
 *
 * Architecture:
 *   shadcn/ui primitives (Radix + tailwind) → PulseOps Design System → feature components → pages
 * shadcn is the foundational primitive layer; PulseOps remains the product-specific design system.
 */

// ── shadcn primitives (foundational) ──
export * from "./button";
export * from "./icon-button";
export * from "./input";
export * from "./textarea";
export * from "./label";
export * from "./separator";
export * from "./select";
export * from "./checkbox";
export { RadioGroup as RadioGroupPrimitive, RadioGroupItem } from "./radio-group";
export * from "./radio";
export * from "./switch";
export * from "./badge";
export * from "./avatar";
export * from "./tooltip";
export * from "./popover";
export * from "./dropdown-menu";
export * from "./dropdown";
export * from "./tabs";
export { Tabs as TabsShadcn, TabsList, TabsTrigger, TabsContent } from "./tabs-primitive";
export * from "./card";
export * from "./table";
export * from "./dialog";
export * from "./alert-dialog";
export * from "./sheet";
export * from "./modal";
export * from "./drawer";
export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator } from "./command";
export { CommandMenu } from "./command-menu";
export type { CommandGroup as CommandMenuGroup, CommandItem as CommandMenuItem, CommandMenuProps } from "./command-menu";
export * from "./calendar";
export * from "./alert";
export * from "./breadcrumb";
export * from "./pagination";
export * from "./skeleton";
export * from "./sonner";

// ── PulseOps-specific compositions (built atop shadcn primitives) ──
export * from "./combobox";
export * from "./date-picker";
export * from "./empty-state";
export * from "./error-state";
export * from "./stat-card";
export * from "./data-table";
export * from "./filter-bar";
export * from "./search-bar";
export * from "./typography";
