"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import * as TabsPrimitive from "@radix-ui/react-tabs";

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  listClassName?: string;
  variant?: "underline" | "pill";
}

// shadcn Tabs (Radix) underneath — PulseOps visual variants preserved
export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  className,
  listClassName,
  variant = "underline",
}: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? items[0]?.value ?? "");
  const current = value !== undefined ? value : internal;

  const handleChange = (v: string) => {
    if (items.find((i) => i.value === v)?.disabled) return;
    if (value === undefined) setInternal(v);
    onValueChange?.(v);
  };

  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      value={current}
      onValueChange={handleChange}
      className={cn("w-full", className)}
    >
      <TabsPrimitive.List
        data-slot="tabs-list"
        className={cn(
          "flex w-full items-center gap-1 overflow-x-auto scrollbar-thin",
          variant === "underline" ? "border-b" : "rounded-lg bg-muted p-1",
          listClassName
        )}
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:outline-none",
              variant === "underline"
                ? cn(
                    "relative -mb-px border-b-2 px-3 py-2.5 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground hover:text-foreground",
                    "data-[state=inactive]:hover:border-muted-foreground/30"
                  )
                : cn(
                    "rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs data-[state=active]:border data-[state=inactive]:text-muted-foreground hover:text-foreground"
                  )
            )}
          >
            {item.icon ? <span aria-hidden>{item.icon}</span> : null}
            {item.label}
            {item.badge !== undefined ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  current === item.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}

export { Tabs as TabsPrimitive };
