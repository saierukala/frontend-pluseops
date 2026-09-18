"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<AvatarSize, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
  xl: "h-14 w-14 text-lg",
};

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  status?: "online" | "offline" | "busy" | "away";
}

export function Avatar({ className, src, alt, fallback, size = "md", status, ...props }: AvatarProps) {
  const [error, setError] = React.useState(false);
  const initials = React.useMemo(() => {
    if (fallback) return fallback.slice(0, 2).toUpperCase();
    if (alt) return alt.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return "?";
  }, [fallback, alt]);

  const statusColor: Record<string, string> = {
    online: "bg-emerald-500",
    offline: "bg-slate-300",
    busy: "bg-red-500",
    away: "bg-amber-500",
  };

  return (
    <span className={cn("relative inline-flex shrink-0", className)} {...props}>
      <span
        className={cn(
          "inline-flex items-center justify-center overflow-hidden rounded-full border bg-muted font-medium text-muted-foreground select-none",
          sizeMap[size]
        )}
      >
        {src && !error ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt ?? "Avatar"}
            className="h-full w-full object-cover"
            onError={() => setError(true)}
          />
        ) : (
          <span aria-hidden>{initials}</span>
        )}
      </span>
      {status ? (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-background",
            statusColor[status],
            size === "sm" ? "h-2.5 w-2.5" : size === "xl" ? "h-3.5 w-3.5" : "h-3 w-3"
          )}
          aria-label={status}
        />
      ) : null}
    </span>
  );
}
