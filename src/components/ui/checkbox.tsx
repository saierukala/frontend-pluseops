"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, disabled, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const hasError = Boolean(error);
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className={cn(
            "flex items-start gap-3 rounded-md",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            className
          )}
        >
          <span className="relative mt-0.5 inline-flex">
            <input
              ref={ref}
              id={inputId}
              type="checkbox"
              disabled={disabled}
              aria-invalid={hasError || undefined}
              aria-describedby={
                hasError ? `${inputId}-error` : description ? `${inputId}-description` : undefined
              }
              className="peer sr-only"
              {...props}
            />
            <span
              aria-hidden
              className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded-md border-2 bg-background shadow-xs transition-colors",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
                "peer-checked:bg-primary peer-checked:border-primary peer-checked:text-primary-foreground",
                "peer-disabled:opacity-50",
                hasError ? "border-destructive" : "border-input peer-checked:border-primary",
                "peer-hover:border-ring/40"
              )}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-0 peer-checked:[&]:opacity-100 scale-75 peer-checked:scale-100 transition-all"
                aria-hidden
              >
                <path d="M5 12l5 5l10 -10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
          {(label || description) && (
            <span className="flex flex-col">
              {label ? <span className="text-sm font-medium leading-5">{label}</span> : null}
              {description ? (
                <span id={`${inputId}-description`} className="text-xs leading-5 text-muted-foreground">
                  {description}
                </span>
              ) : null}
            </span>
          )}
        </label>
        {hasError ? (
          <p id={`${inputId}-error`} className="ml-8 text-xs font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
