"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

function SwitchRoot({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

// PulseOps compat: <Switch label description size>
// Supports both Radix API (checked + onCheckedChange) and legacy F02 API (checked + onChange(e))
export interface SwitchProps extends Omit<React.ComponentProps<typeof SwitchPrimitive.Root>, "size" | "onChange"> {
  label?: string;
  description?: string;
  size?: "sm" | "md";
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

function Switch({ className, label, description, size = "md", id, onChange, onCheckedChange, ...props }: SwitchProps) {
  const autoId = React.useId();
  const switchId = id ?? autoId;
  const handleCheckedChange = React.useCallback(
    (checked: boolean) => {
      onCheckedChange?.(checked);
      if (onChange) {
        const synthetic = { target: { checked } } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange(synthetic);
      }
    },
    [onChange, onCheckedChange]
  );

  return (
    <label
      htmlFor={switchId}
      className={cn(
        "flex items-center gap-3",
        props.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className
      )}
    >
      <SwitchRoot
        id={switchId}
        className={cn(size === "sm" && "h-5 w-9 [&_[data-slot=switch-thumb]]:size-4")}
        onCheckedChange={handleCheckedChange}
        {...props}
      />
      {(label || description) && (
        <span className="flex flex-col">
          {label ? <span className="text-sm font-medium leading-none">{label}</span> : null}
          {description ? <span className="text-xs text-muted-foreground">{description}</span> : null}
        </span>
      )}
    </label>
  );
}

export { Switch, SwitchRoot };
