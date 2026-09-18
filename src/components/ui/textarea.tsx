"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, id, ...props }, ref) => {
    const hasError = Boolean(error);
    return (
      <div className="flex flex-col gap-1.5">
        <textarea
          ref={ref}
          id={id}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError && id ? `${id}-error` : undefined}
          className={cn(
            "flex min-h-[96px] w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs transition-colors",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted",
            hasError ? "border-destructive focus-visible:ring-destructive" : "border-input hover:border-ring/30",
            className
          )}
          {...props}
        />
        {hasError ? (
          <p id={id ? `${id}-error` : undefined} className="text-xs font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
