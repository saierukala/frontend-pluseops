"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, id, disabled, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    return (
      <label
        htmlFor={inputId}
        className={cn(
          "flex items-start gap-3 rounded-md",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          className
        )}
      >
        <span className="relative mt-0.5 inline-flex">
          <input ref={ref} id={inputId} type="radio" disabled={disabled} className="peer sr-only" {...props} />
          <span
            aria-hidden
            className={cn(
              "inline-flex h-5 w-5 items-center justify-center rounded-full border-2 bg-background shadow-xs transition-colors",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
              "peer-checked:border-primary",
              "border-input peer-hover:border-ring/40"
            )}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-opacity" />
          </span>
        </span>
        {(label || description) && (
          <span className="flex flex-col">
            {label ? <span className="text-sm font-medium leading-5">{label}</span> : null}
            {description ? (
              <span className="text-xs leading-5 text-muted-foreground">{description}</span>
            ) : null}
          </span>
        )}
      </label>
    );
  }
);
Radio.displayName = "Radio";

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: { value: string; label: string; description?: string; disabled?: boolean }[];
  orientation?: "vertical" | "horizontal";
  error?: string;
}

export function RadioGroup({
  name,
  value,
  defaultValue,
  onValueChange,
  options,
  orientation = "vertical",
  error,
  className,
  ...props
}: RadioGroupProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const current = value !== undefined ? value : internal;

  return (
    <div
      role="radiogroup"
      className={cn(
        "flex gap-3",
        orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
        className
      )}
      {...props}
    >
      {options.map((opt) => (
        <Radio
          key={opt.value}
          name={name}
          value={opt.value}
          checked={current === opt.value}
          disabled={opt.disabled}
          label={opt.label}
          description={opt.description}
          onChange={(e) => {
            const v = e.target.value;
            if (value === undefined) setInternal(v);
            onValueChange?.(v);
          }}
        />
      ))}
      {error ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
