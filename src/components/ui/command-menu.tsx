"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  keywords?: string[];
  onSelect: () => void;
}

export interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

export interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CommandGroup[];
  placeholder?: string;
  emptyText?: string;
}

export function CommandMenu({
  open,
  onOpenChange,
  groups,
  placeholder = "Type a command or search…",
  emptyText = "No results found.",
}: CommandMenuProps) {
  const [query, setQuery] = React.useState("");
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on open is intentional and not a render cascade in practice
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 0);
      const all = groups.flatMap((g) => g.items);
      setActiveId(all[0]?.id ?? null);
    }
  }, [open, groups]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(false);
      } else if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const filteredGroups = React.useMemo(() => {
    if (!query) return groups;
    const q = query.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) =>
            it.label.toLowerCase().includes(q) ||
            it.description?.toLowerCase().includes(q) ||
            it.keywords?.some((k) => k.toLowerCase().includes(q))
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);

  const flatItems = React.useMemo(() => filteredGroups.flatMap((g) => g.items), [filteredGroups]);

  const move = (dir: 1 | -1) => {
    if (flatItems.length === 0) return;
    const idx = flatItems.findIndex((i) => i.id === activeId);
    const next = (idx + dir + flatItems.length) % flatItems.length;
    setActiveId(flatItems[next].id);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-[20vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Command menu"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border bg-popover shadow-xl">
        <div className="flex items-center gap-3 border-b px-4">
          <span className="text-muted-foreground" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                move(1);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                move(-1);
              } else if (e.key === "Enter") {
                e.preventDefault();
                const item = flatItems.find((i) => i.id === activeId);
                if (item) {
                  item.onSelect();
                  onOpenChange(false);
                }
              }
            }}
            placeholder={placeholder}
            aria-label="Search commands"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <span className="hidden rounded border bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground sm:inline-flex">ESC</span>
        </div>

        <div ref={listRef} className="max-h-80 overflow-auto p-2">
          {filteredGroups.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.heading} className="mb-2">
                <h4 className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.heading}
                </h4>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = item.id === activeId;
                    return (
                      <button
                        key={item.id}
                        role="option"
                        aria-selected={active}
                        onMouseEnter={() => setActiveId(item.id)}
                        onClick={() => {
                          item.onSelect();
                          onOpenChange(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                          active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
                          "focus:outline-none focus-visible:bg-accent"
                        )}
                      >
                        {item.icon ? (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            {item.icon}
                          </span>
                        ) : null}
                        <span className="flex-1">
                          <span className="block text-sm font-medium">{item.label}</span>
                          {item.description ? (
                            <span className="block text-xs text-muted-foreground">{item.description}</span>
                          ) : null}
                        </span>
                        {item.shortcut ? (
                          <span className="rounded border bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                            {item.shortcut}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span>Navigate ↑↓ • Select ↵</span>
          <span>⌘K to toggle</span>
        </div>
      </div>
    </div>
  );
}
