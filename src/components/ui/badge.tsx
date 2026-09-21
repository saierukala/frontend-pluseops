"use client";

import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/70",
        outline: "bg-background text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
        warning:
          "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30",
        info: "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px] leading-3 font-semibold tracking-wide uppercase",
        md: "px-2.5 py-0.5 text-xs font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "info";
export type BadgeSize = "sm" | "md";

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

function Badge({
  className,
  variant = "default",
  size = "md",
  asChild = false,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";
  if (asChild) {
    return (
      <Comp data-slot="badge" className={cn(badgeVariants({ variant, size }), className)} {...props}>
        {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden /> : null}
        <Slottable>{children}</Slottable>
      </Comp>
    );
  }
  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden /> : null}
      {children}
    </Comp>
  );
}

export { Badge, badgeVariants };
