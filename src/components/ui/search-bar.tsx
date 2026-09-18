"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  onValueChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  loading?: boolean;
  clearable?: boolean;
}

export function SearchBar({
  className,
  value,
  onValueChange,
  onSearch,
  placeholder = "Search…",
  debounceMs = 300,
  loading = false,
  clearable = true,
  id: idProp,
  ...props
}: SearchBarProps) {
  const autoId = React.useId();
  const inputId = idProp ?? autoId;
  const [internal, setInternal] = React.useState(value ?? "");
  const current = value !== undefined ? value : internal;
  const debounceRef = React.useRef<number | null>(null);

  const handleChange = (v: string) => {
    if (value === undefined) setInternal(v);
    onValueChange?.(v);
    if (onSearch) {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => onSearch(v), debounceMs);
    }
  };

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div
      className={cn(
        "flex h-10 w-full items-center gap-2 rounded-xl border bg-background px-3 shadow-xs transition-colors",
        "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0",
        "hover:border-ring/30",
        className
      )}
    >
      <span className="inline-flex shrink-0 text-muted-foreground" aria-hidden>
        {loading ? (
          <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        )}
      </span>
      <input
        id={inputId}
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label={props["aria-label"] ?? "Search"}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        {...props}
      />
      {clearable && current ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => handleChange("")}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      ) : null}
      {props["aria-describedby"] ? null : null}
    </div>
  );
}
