"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string;
  onValueChange?: (value: string) => void;
  error?: string;
  label?: string;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, value, onValueChange, error, id: idProp, label, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = idProp ?? autoId;
    const hasError = Boolean(error);
    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium leading-none">
            {label}
          </label>
        ) : null}
        <div
          className={cn(
            "relative flex h-9 w-full items-center rounded-lg border bg-background shadow-xs transition-colors",
            "has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring",
            hasError ? "border-destructive" : "border-input",
            className
          )}
        >
          <input
            ref={ref}
            id={inputId}
            type="date"
            value={value}
            onChange={(e) => onValueChange?.(e.target.value)}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
            className="h-full w-full rounded-lg bg-transparent px-3 pr-9 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
            {...props}
          />
          <span className="pointer-events-none absolute right-3 text-muted-foreground" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </span>
        </div>
        {hasError ? (
          <p id={`${inputId}-error`} className="text-xs font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
DatePicker.displayName = "DatePicker";

export interface DateRangePickerProps {
  from?: string;
  to?: string;
  onFromChange?: (v: string) => void;
  onToChange?: (v: string) => void;
  error?: string;
  id?: string;
  className?: string;
  label?: string;
}

export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  error,
  id: idProp,
  className,
  label,
}: DateRangePickerProps) {
  const autoId = React.useId();
  const baseId = idProp ?? autoId;
  const hasError = Boolean(error);
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? <span className="text-sm font-medium">{label}</span> : null}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <DatePicker value={from} onValueChange={onFromChange} id={`${baseId}-from`} aria-label="Start date" />
        </div>
        <span className="text-sm text-muted-foreground" aria-hidden>
          —
        </span>
        <div className="flex-1">
          <DatePicker value={to} onValueChange={onToChange} id={`${baseId}-to`} aria-label="End date" />
        </div>
      </div>
      {hasError ? (
        <p id={`${baseId}-error`} className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
