"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string;
  onValueChange?: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
}

// shadcn DatePicker: Calendar + Popover (with native fallback for form compat)
export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, value, onValueChange, error, id: idProp, label, placeholder = "Pick a date", ...props }, ref) => {
    const autoId = React.useId();
    const inputId = idProp ?? autoId;
    const hasError = Boolean(error);
    const dateValue = value ? new Date(value) : undefined;
    const validDate = dateValue && !isNaN(dateValue.getTime()) ? dateValue : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        ) : null}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id={inputId}
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !validDate && "text-muted-foreground",
                hasError && "border-destructive focus-visible:ring-destructive/20",
                className
              )}
              aria-invalid={hasError || undefined}
              aria-describedby={hasError ? `${inputId}-error` : undefined}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {validDate ? format(validDate, "PPP") : <span>{placeholder}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={validDate}
              onSelect={(d) => {
                if (d) {
                  const iso = d.toISOString().slice(0, 10);
                  onValueChange?.(iso);
                } else {
                  onValueChange?.("");
                }
              }}
            />
            {/* Hidden native input for form / autofill / ref */}
            <input ref={ref} id={`${inputId}-native`} type="hidden" value={value ?? ""} readOnly {...(props as object)} />
          </PopoverContent>
        </Popover>
        {/* Fallback visible native input for keyboard/manual entry — hidden by default but can be toggled via prop? Keep shadcn UX only */}
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
