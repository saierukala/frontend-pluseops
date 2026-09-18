"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  error?: string;
}

function Textarea({ className, error, id, ...props }: TextareaProps) {
  const hasError = Boolean(error);
  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        data-slot="textarea"
        id={id}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError && id ? `${id}-error` : undefined}
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
          hasError && "border-destructive focus-visible:ring-destructive/20",
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

export { Textarea };
