"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Select, type SelectOption } from "./select";

export interface FilterDefinition {
  key: string;
  label: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
}

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  filters: FilterDefinition[];
  onClear?: () => void;
  onApply?: () => void;
  activeCount?: number;
  collapsible?: boolean;
}

export function FilterBar({
  className,
  filters,
  onClear,
  onApply,
  activeCount,
  collapsible = false,
  ...props
}: FilterBarProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-xs", className)} {...props}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Filters</span>
          {activeCount !== undefined && activeCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {collapsible ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed((v) => !v)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand filters" : "Collapse filters"}
            >
              {collapsed ? "Show" : "Hide"}
            </Button>
          ) : null}
          {onClear ? (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          ) : null}
          {onApply ? (
            <Button variant="primary" size="sm" onClick={onApply}>
              Apply
            </Button>
          ) : null}
        </div>
      </div>

      {!collapsed ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filters.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
              <Select
                options={f.options}
                value={f.value ?? ""}
                placeholder={f.placeholder ?? `All ${f.label.toLowerCase()}`}
                onValueChange={f.onValueChange}
                aria-label={f.label}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
