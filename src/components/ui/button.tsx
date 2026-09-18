"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "destructive" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-[var(--primary-hover)] shadow-xs border border-transparent focus-visible:ring-2 focus-visible:ring-ring disabled:bg-muted disabled:text-muted-foreground",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent shadow-xs focus-visible:ring-2 focus-visible:ring-ring",
  outline:
    "bg-background text-foreground border border-input hover:bg-accent hover:text-accent-foreground shadow-xs focus-visible:ring-2 focus-visible:ring-ring",
  ghost: "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground border border-transparent focus-visible:ring-2 focus-visible:ring-ring",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-red-700 shadow-xs border border-transparent focus-visible:ring-2 focus-visible:ring-destructive",
  link: "bg-transparent text-primary underline-offset-4 hover:underline border border-transparent px-0 h-auto py-0 shadow-none",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs font-medium rounded-md",
  md: "h-9 px-4 text-sm font-medium rounded-lg",
  lg: "h-10 px-6 text-sm font-semibold rounded-lg",
  icon: "h-9 w-9 p-0 rounded-lg",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors duration-150 select-none",
          "focus-visible:outline-none focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
          "motion-reduce:transition-none",
          variant !== "link" && "active:scale-[0.98]",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
        ) : leftIcon ? (
          <span className="inline-flex shrink-0" aria-hidden>
            {leftIcon}
          </span>
        ) : null}
        {children ? <span className="truncate">{children}</span> : null}
        {!loading && rightIcon ? (
          <span className="inline-flex shrink-0" aria-hidden>
            {rightIcon}
          </span>
        ) : null}
      </button>
    );
  }
);
Button.displayName = "Button";
