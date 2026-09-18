"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  id?: string;
  error?: string;
  className?: string;
}

// shadcn Combobox: Popover + Command (cmdk) underneath — PulseOps API preserved
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results found.",
  disabled,
  id,
  error,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-describedby={error && id ? `${id}-error` : undefined}
            disabled={disabled}
            className={cn("w-full justify-between font-normal", !selected && "text-muted-foreground", error && "border-destructive focus-visible:ring-destructive/20")}
          >
            <span className="truncate">{selected ? selected.label : placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const active = opt.value === value;
                  return (
                    <CommandItem
                      key={opt.value}
                      value={opt.label + " " + opt.value}
                      onSelect={() => {
                        onValueChange?.(opt.value === value ? "" : opt.value);
                        setOpen(false);
                      }}
                    >
                      <span className="flex flex-col flex-1">
                        <span className="font-medium">{opt.label}</span>
                        {opt.description ? <span className="text-xs text-muted-foreground">{opt.description}</span> : null}
                      </span>
                      <Check className={cn("ml-auto h-4 w-4", active ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error ? (
        <p id={id ? `${id}-error` : undefined} className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
