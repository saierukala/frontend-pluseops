"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

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
  const titleId = React.useId();
  const descId = React.useId();
  const overlayRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const sideClasses =
    side === "right"
      ? "right-0 top-0 h-full border-l"
      : side === "left"
        ? "left-0 top-0 h-full border-r"
        : "bottom-0 left-0 w-full border-t rounded-t-xl";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onOpenChange(false);
      }}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
    >
      <div
        className={cn(
          "absolute flex flex-col bg-background shadow-xl",
          "animate-in duration-200 motion-reduce:animate-none",
          side === "right" && "slide-in-from-right",
          side === "left" && "slide-in-from-left",
          side === "bottom" && "slide-in-from-bottom",
          sideClasses,
          sizeSideMap[side][size],
          className
        )}
      >
        {(title || description) && (
          <div className="border-b px-6 py-4">
            {title ? (
              <h2 id={titleId} className="text-base font-semibold">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p id={descId} className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
            <button
              type="button"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}
