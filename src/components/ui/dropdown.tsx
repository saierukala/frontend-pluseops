"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

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

export function Dropdown({ trigger, items, align = "start", className }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <span onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        {trigger}
      </span>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute top-[calc(100%+8px)] z-50 min-w-52 rounded-xl border bg-popover p-1 shadow-lg",
            align === "end" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, idx) => {
            if ("type" in item) {
              if (item.type === "separator") return <div key={idx} className="my-1 h-px bg-border" role="separator" />;
              return (
                <div key={idx} className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {item.label}
                </div>
              );
            }
            return (
              <button
                key={idx}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled) return;
                  item.onSelect?.();
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:bg-accent",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  item.destructive && "text-destructive hover:bg-destructive/10"
                )}
              >
                {item.icon ? (
                  <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
                    {item.icon}
                  </span>
                ) : null}
                <span className="flex-1 truncate">{item.label}</span>
                {item.shortcut ? <span className="text-xs text-muted-foreground">{item.shortcut}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
