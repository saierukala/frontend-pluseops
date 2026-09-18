"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export interface DropdownItem {
  label: string;
  value?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: () => void;
  shortcut?: string;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: (DropdownItem | { type: "separator" } | { type: "label"; label: string })[];
  align?: "start" | "end";
  className?: string;
}

// PulseOps Dropdown — now backed by shadcn DropdownMenu (Radix)
export function Dropdown({ trigger, items, align = "start", className }: DropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span className={cn("inline-flex", className)} aria-haspopup="menu">
          {trigger}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-52">
        {items.map((item, idx) => {
          if ("type" in item) {
            if (item.type === "separator") return <DropdownMenuSeparator key={idx} />;
            return (
              <DropdownMenuLabel key={idx} className="text-xs font-semibold text-muted-foreground">
                {item.label}
              </DropdownMenuLabel>
            );
          }
          return (
            <DropdownMenuItem
              key={idx}
              disabled={item.disabled}
              variant={item.destructive ? "destructive" : "default"}
              onSelect={() => {
                if (item.disabled) return;
                item.onSelect?.();
              }}
              className="gap-2"
            >
              {item.icon ? (
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
                  {item.icon}
                </span>
              ) : null}
              <span className="flex-1 truncate">{item.label}</span>
              {item.shortcut ? <span className="text-xs text-muted-foreground">{item.shortcut}</span> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
