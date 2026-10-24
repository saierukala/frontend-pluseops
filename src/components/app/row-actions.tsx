"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface RowAction {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  hidden?: boolean;
}

/** Kebab menu for a table row. Clicks don't bubble to the row's own click handler. */
export function RowActions({ actions, label = "Row actions" }: { actions: RowAction[]; label?: string }) {
  const visible = actions.filter((a) => !a.hidden);
  if (!visible.length) return null;
  const regular = visible.filter((a) => !a.destructive);
  const destructive = visible.filter((a) => a.destructive);

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground opacity-70 group-hover:opacity-100 data-[state=open]:opacity-100" aria-label={label}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          {regular.map(({ label: text, icon: Icon, onSelect }) => (
            <DropdownMenuItem key={text} onSelect={onSelect}>
              {Icon ? <Icon /> : null}
              {text}
            </DropdownMenuItem>
          ))}
          {regular.length && destructive.length ? <DropdownMenuSeparator /> : null}
          {destructive.map(({ label: text, icon: Icon, onSelect }) => (
            <DropdownMenuItem key={text} onSelect={onSelect} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
              {Icon ? <Icon /> : null}
              {text}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
