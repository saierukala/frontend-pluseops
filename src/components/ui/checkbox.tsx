"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function CheckboxPrimitiveRoot({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="flex items-center justify-center text-current transition-none">
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

// PulseOps compat: <Checkbox label description error> — builds on shadcn checkbox primitive
// Supports both Radix API (checked + onCheckedChange) and legacy F02 API (checked + onChange(e))
export interface CheckboxProps extends Omit<React.ComponentProps<typeof CheckboxPrimitive.Root>, "type" | "onChange"> {
  label?: string;
  description?: string;
  error?: string;
  id?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

function Checkbox({ className, label, description, error, id, onChange, onCheckedChange, checked, ...props }: CheckboxProps) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  const hasError = Boolean(error);
  const handleCheckedChange = React.useCallback(
    (c: boolean | "indeterminate") => {
      const b = c === true;
      (onCheckedChange as ((c: boolean) => void) | undefined)?.(b);
      if (onChange) {
        const synthetic = { target: { checked: b } } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange(synthetic);
      }
    },
    [onChange, onCheckedChange]
  );

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className={cn(
          "flex items-start gap-3 rounded-md",
          props.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          className
        )}
      >
        <CheckboxPrimitiveRoot
          id={inputId}
          checked={checked}
          onCheckedChange={handleCheckedChange}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? `${inputId}-error` : description ? `${inputId}-description` : undefined}
          {...(props as Omit<typeof props, "checked" | "onCheckedChange">)}
          className={cn(hasError && "border-destructive", "mt-0.5")}
        />
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

export { Checkbox, CheckboxPrimitiveRoot as CheckboxPrimitive };
