"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const sizeMap: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]",
};

// PulseOps Modal — generic container, now shadcn Dialog (Radix) underneath
export function Modal({ open, onOpenChange, children, title, description, size = "md", className }: ModalProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("flex max-h-[90vh] flex-col overflow-hidden p-0 gap-0", sizeMap[size], className)}>
        {(title || description) && (
          <DialogHeader className="border-b px-6 py-4 shrink-0">
            {title ? <DialogTitle>{title}</DialogTitle> : null}
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
        )}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </DialogContent>
    </DialogRoot>
  );
}
