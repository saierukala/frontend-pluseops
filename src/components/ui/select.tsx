"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  onValueChange?: (value: string) => void;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder = "Select…", error, onValueChange, id, value, defaultValue, onChange, ...props }, ref) => {
    const hasError = Boolean(error);
    return (
      <div className="flex flex-col gap-1.5">
        <div className="relative">
          <select
            ref={ref}
            id={id}
            value={value}
            defaultValue={defaultValue}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError && id ? `${id}-error` : undefined}
            onChange={(e) => {
              onChange?.(e);
              onValueChange?.(e.target.value);
            }}
            className={cn(
              "flex h-9 w-full appearance-none rounded-lg border bg-background px-3 pr-9 text-sm shadow-xs transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted",
              hasError ? "border-destructive focus-visible:ring-destructive" : "border-input",
              className
            )}
            {...props}
          >
            {placeholder ? (
              <option value="" disabled={value !== "" && value !== undefined}>
                {placeholder}
              </option>
            ) : null}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </div>
        {hasError ? (
          <p id={id ? `${id}-error` : undefined} className="text-xs font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = "Select";
