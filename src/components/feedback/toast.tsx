"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  toast: (item: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (item: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).slice(2);
      const entry: ToastItem = { id, duration: 4000, variant: "default", ...item };
      setToasts((prev) => [...prev, entry]);
      if (entry.duration !== Infinity) {
        window.setTimeout(() => dismiss(id), entry.duration);
      }
      return id;
    },
    [dismiss]
  );

  const success = React.useCallback((title: string, description?: string) => toast({ title, description, variant: "success" }), [toast]);
  const error = React.useCallback((title: string, description?: string) => toast({ title, description, variant: "error" }), [toast]);
  const info = React.useCallback((title: string, description?: string) => toast({ title, description, variant: "info" }), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, success, error, info }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex gap-3 rounded-xl border bg-card p-4 shadow-lg",
            "animate-in slide-in-from-bottom-2 duration-200 motion-reduce:animate-none",
            t.variant === "success" && "border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800",
            t.variant === "error" && "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800",
            t.variant === "info" && "border-sky-200 bg-sky-50 dark:bg-sky-950 dark:border-sky-800",
            t.variant === "warning" && "border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800"
          )}
        >
          <div className="flex-1">
            {t.title ? <p className="text-sm font-semibold leading-none">{t.title}</p> : null}
            {t.description ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{t.description}</p> : null}
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => onDismiss(t.id)}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
