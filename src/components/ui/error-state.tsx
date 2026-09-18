"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  requestId?: string;
  onRetry?: () => void;
  onReset?: () => void;
  retryLabel?: string;
  variant?: "default" | "card";
}

export function ErrorState({
  className,
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again.",
  requestId,
  onRetry,
  onReset,
  retryLabel = "Try again",
  variant = "card",
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        variant === "card" && "rounded-xl border bg-card shadow-xs",
        className
      )}
      {...props}
    >
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v6M12 16h.01" />
        </svg>
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {requestId ? <p className="mt-2 text-xs font-mono text-muted-foreground">Request ID: {requestId}</p> : null}
      <div className="mt-6 flex gap-3">
        {onRetry ? (
          <Button variant="primary" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
        {onReset ? (
          <Button variant="outline" size="sm" onClick={onReset}>
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  );
}
