"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  error?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

function Input({ className, type = "text", error, leftElement, rightElement, id, ...props }: InputProps) {
  const hasError = Boolean(error);
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          "flex h-9 w-full items-center rounded-lg border bg-background px-3 shadow-xs transition-colors",
          "has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring has-[input:focus-visible]:ring-offset-0",
          "has-[input:disabled]:opacity-60 has-[input:disabled]:bg-muted",
          hasError && "border-destructive has-[input:focus-visible]:ring-destructive",
          !hasError && "border-input hover:border-ring/30",
          // shadcn input focus tokens — stays PulseOps-colored via --ring/--border vars
          "focus-within:border-ring focus-within:ring-ring/50",
          className
        )}
      >
        {leftElement ? (
          <span className="mr-2 inline-flex shrink-0 text-muted-foreground" aria-hidden>
            {leftElement}
          </span>
        ) : null}
        <input
          data-slot="input"
          type={type}
          id={id}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError && id ? `${id}-error` : undefined}
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium"
          {...props}
        />
        {rightElement ? (
          <span className="ml-2 inline-flex shrink-0 text-muted-foreground" aria-hidden>
            {rightElement}
          </span>
        ) : null}
      </div>
      {hasError ? (
        <p id={id ? `${id}-error` : undefined} className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { Input };
