"use client";

import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 motion-reduce:transition-none select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-[var(--primary-hover)] border border-transparent",
        primary:
          "bg-primary text-primary-foreground hover:bg-[var(--primary-hover)] shadow-xs border border-transparent",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 border border-transparent",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground border-input",
        ghost: "hover:bg-accent hover:text-accent-foreground border border-transparent bg-transparent",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-red-700 border border-transparent focus-visible:ring-destructive/20",
        link: "text-primary underline-offset-4 hover:underline bg-transparent border border-transparent px-0 h-auto py-0 shadow-none",
      },
      size: {
        default: "h-9 px-4 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        md: "h-9 px-4 text-sm font-medium rounded-lg",
        lg: "h-10 rounded-lg px-6 has-[>svg]:px-4 text-sm font-semibold",
        icon: "size-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "destructive" | "link" | "default";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "default";

export interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const isDisabled = disabled || loading;
  // Map PulseOps size tokens to shadcn variants for visual consistency
  const sizeMap: Record<string, ButtonSize> = {
    sm: "sm",
    md: "md",
    lg: "lg",
    icon: "icon",
    default: "default",
  };
  const resolvedSize = sizeMap[size ?? "md"] ?? "md";

  if (asChild) {
    return (
      <Slot
        data-slot="button"
        className={cn(
          buttonVariants({ variant: variant as never, size: resolvedSize as never, className }),
          variant !== "link" && "active:scale-[0.98]"
        )}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        {...props}
      >
        {loading ? (
          <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
        ) : leftIcon ? (
          <span className="inline-flex shrink-0" aria-hidden>
            {leftIcon}
          </span>
        ) : null}
        <Slottable>{children}</Slottable>
        {!loading && rightIcon ? (
          <span className="inline-flex shrink-0" aria-hidden>
            {rightIcon}
          </span>
        ) : null}
      </Slot>
    );
  }

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant: variant as never, size: resolvedSize as never, className }),
        variant !== "link" && "active:scale-[0.98]"
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
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
    </Comp>
  );
}

export { Button, buttonVariants };
