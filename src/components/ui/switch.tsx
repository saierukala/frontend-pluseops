"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: string;
  description?: string;
  size?: "sm" | "md";
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, size = "md", id, disabled, checked, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    return (
      <label
        htmlFor={inputId}
        className={cn(
          "flex items-center gap-3",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          className
        )}
      >
        <span className="relative inline-flex shrink-0">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <span
            aria-hidden
            className={cn(
              "inline-flex items-center rounded-full border-2 border-transparent bg-input transition-colors duration-200",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
              "peer-checked:bg-primary",
              size === "sm" ? "h-5 w-9" : "h-6 w-11"
            )}
          >
            <span
              className={cn(
                "inline-block rounded-full bg-white shadow-xs transition-transform duration-200",
                size === "sm" ? "h-4 w-4" : "h-5 w-5",
                "translate-x-0 peer-checked:translate-x-5",
                size === "sm" && "peer-checked:translate-x-4"
              )}
            />
          </span>
        </span>
        {(label || description) && (
          <span className="flex flex-col">
            {label ? <span className="text-sm font-medium leading-none">{label}</span> : null}
            {description ? <span className="text-xs text-muted-foreground">{description}</span> : null}
          </span>
        )}
      </label>
    );
  }
);
Switch.displayName = "Switch";
