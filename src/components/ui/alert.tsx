"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border-border",
        info: "bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-100 [&>svg]:text-sky-600 dark:[&>svg]:text-sky-300",
        success: "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-100 [&>svg]:text-emerald-600",
        warning: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-100 [&>svg]:text-amber-600",
        destructive: "bg-red-50 border-red-200 text-red-900 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-100 [&>svg]:text-destructive dark:[&>svg]:text-red-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type AlertVariant = "default" | "info" | "success" | "warning" | "destructive";

function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-title" className={cn("col-start-2 line-clamp-1 min-h-4 font-semibold tracking-tight", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-description" className={cn("text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm leading-6 [&_p]:leading-relaxed", className)} {...props} />;
}

// PulseOps compat: <Alert variant title icon dismissible onDismiss>
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function AlertCompat({ className, variant = "default", title, icon, children, dismissible, onDismiss, ...props }: AlertProps) {
  return (
    <Alert variant={variant} className={className} {...props}>
      {icon ? <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>{icon}</span> : null}
      <div className="flex-1 col-start-2">
        {title ? <AlertTitle className="mb-1 font-semibold leading-none text-current">{title}</AlertTitle> : null}
        {children ? <AlertDescription className="text-current opacity-90 [&_a]:underline [&_a]:underline-offset-2">{children}</AlertDescription> : null}
      </div>
      {dismissible ? (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="col-start-3 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </Alert>
  );
}

// Keep default export as compat for existing imports
export { AlertCompat as Alert };
export { Alert as AlertPrimitive, AlertTitle, AlertDescription, alertVariants };
