"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export interface DateDisplayProps extends React.HTMLAttributes<HTMLTimeElement> {
  value: Date | string | number;
  format?: Intl.DateTimeFormatOptions;
  locale?: string;
  relative?: boolean;
  prefix?: string;
}

function relativeTime(d: Date): string {
  const now = Date.now();
  const diff = now - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min > 1 ? "s" : ""} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr > 1 ? "s" : ""} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day > 1 ? "s" : ""} ago`;
  return formatDate(d);
}

export function DateDisplay({
  className,
  value,
  format,
  locale = "en-IN",
  relative = false,
  prefix,
  ...props
}: DateDisplayProps) {
  const d = value instanceof Date ? value : new Date(value);
  const isValid = !Number.isNaN(d.getTime());
  // Avoid hydration mismatch for relative time (Date.now() drift server vs client):
  // render stable absolute date on server, update to relative after mount.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount flag to avoid Date.now() hydration drift
    if (relative) setMounted(true);
  }, [relative]);
  const display = isValid
    ? relative && mounted
      ? relativeTime(d)
      : formatDate(d, format, locale)
    : String(value);
  return (
    <time
      suppressHydrationWarning
      dateTime={isValid ? d.toISOString() : undefined}
      className={cn("text-sm", className)}
      {...props}
    >
      {prefix ? `${prefix} ${display}` : display}
    </time>
  );
}
