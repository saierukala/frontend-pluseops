"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./sheet";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  side?: "right" | "left" | "bottom";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeSideMap: Record<string, Record<string, string>> = {
  right: { sm: "max-w-sm w-full", md: "max-w-lg w-full", lg: "max-w-xl w-full" },
  left: { sm: "max-w-sm w-full", md: "max-w-lg w-full", lg: "max-w-xl w-full" },
  bottom: { sm: "max-h-[50vh]", md: "max-h-[70vh]", lg: "max-h-[85vh]" },
};

// PulseOps Drawer — shadcn Sheet (Radix Dialog) underneath, preserves F02 API
export function Drawer({
  open,
  onOpenChange,
  children,
  title,
  description,
  side = "right",
  size = "md",
  className,
}: DrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(sizeSideMap[side][size], className, side === "bottom" && "p-0")}
        aria-describedby={description ? undefined : undefined}
      >
        {(title || description) && (
          <SheetHeader>
            {title ? <SheetTitle>{title}</SheetTitle> : null}
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </SheetHeader>
        )}
        <div className="flex-1 overflow-auto p-6 pt-2">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
