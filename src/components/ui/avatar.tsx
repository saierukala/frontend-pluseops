"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<AvatarSize, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
  xl: "h-14 w-14 text-lg",
};

function AvatarRoot({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image data-slot="avatar-image" className={cn("aspect-square size-full object-cover", className)} {...props} />;
}

function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn("bg-muted flex size-full items-center justify-center rounded-full text-muted-foreground font-medium select-none", className)}
      {...props}
    />
  );
}

// PulseOps compat wrapper — preserves existing <Avatar src fallback size status> API
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  status?: "online" | "offline" | "busy" | "away";
}

export function Avatar({ className, src, alt, fallback, size = "md", status, ...props }: AvatarProps) {
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
      <AvatarRoot className={cn("border bg-muted", sizeMap[size])}>
        {src ? <AvatarImage src={src} alt={alt ?? "Avatar"} /> : null}
        <AvatarFallback className={sizeMap[size]}>{initials}</AvatarFallback>
      </AvatarRoot>
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

export { AvatarRoot as AvatarPrimitive, AvatarImage, AvatarFallback };
