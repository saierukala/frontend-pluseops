"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

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

  const onSelect = (v: string) => {
    if (items.find((i) => i.value === v)?.disabled) return;
    if (value === undefined) setInternal(v);
    onValueChange?.(v);
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className={cn(
          "flex w-full items-center gap-1 overflow-x-auto scrollbar-thin",
          variant === "underline" ? "border-b" : "rounded-lg bg-muted p-1",
          listClassName
        )}
      >
        {items.map((item) => {
          const active = item.value === current;
          return (
            <button
              key={item.value}
              role="tab"
              aria-selected={active}
              aria-disabled={item.disabled || undefined}
              disabled={item.disabled}
              onClick={() => onSelect(item.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const idx = items.findIndex((i) => i.value === current);
                  const dir = e.key === "ArrowRight" ? 1 : -1;
                  let next = idx;
                  for (let i = 0; i < items.length; i++) {
                    next = (next + dir + items.length) % items.length;
                    if (!items[next].disabled) break;
                  }
                  onSelect(items[next].value);
                }
              }}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                variant === "underline"
                  ? cn(
                      "relative -mb-px border-b-2 px-3 py-2.5",
                      active
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                    )
                  : cn(
                      "rounded-md px-3 py-1.5",
                      active ? "bg-background text-foreground shadow-xs border" : "text-muted-foreground hover:text-foreground"
                    )
              )}
            >
              {item.icon ? <span aria-hidden>{item.icon}</span> : null}
              {item.label}
              {item.badge !== undefined ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
