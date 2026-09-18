"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type AlertVariant = "default" | "info" | "success" | "warning" | "destructive";

const variantStyles: Record<AlertVariant, string> = {
  default: "bg-card border-border text-foreground",
  info: "bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-100",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-100",
  warning: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-100",
  destructive: "bg-red-50 border-red-200 text-red-900 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-100",
};

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Alert({
  className,
  variant = "default",
  title,
  icon,
  children,
  dismissible,
  onDismiss,
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "relative flex gap-3 rounded-xl border p-4 text-sm",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {icon ? (
        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
          {icon}
        </span>
      ) : null}
      <div className="flex-1">
        {title ? <h5 className="mb-1 font-semibold leading-none">{title}</h5> : null}
        {children ? <div className="leading-6 opacity-90 [&_a]:underline [&_a]:underline-offset-2">{children}</div> : null}
      </div>
      {dismissible ? (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
