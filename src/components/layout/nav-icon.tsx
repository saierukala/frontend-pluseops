"use client";

import { cn } from "@/lib/utils";

const icons: Record<string, React.ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  products: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2l9 4.5v9L12 20 3 15.5v-9L12 2z" />
      <path d="M3 7.5L12 12l9-4.5" />
      <path d="M12 12v8" />
    </svg>
  ),
  categories: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  ),
  attributes: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v18M4 8h16M4 16h16" />
      <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="2" fill="currentColor" stroke="none" />
    </svg>
  ),
  inventory: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 12l9 4 9-4" />
      <path d="M3 17l9 4 9-4" />
    </svg>
  ),
  warehouses: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 9l9-5 9 5-9 5-9-5z" />
      <path d="M3 9v6l9 5 9-5V9" />
      <path d="M12 14v6" />
    </svg>
  ),
  movements: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 16l-3-3 3-3M17 8l3 3-3 3M4 13h12M20 11H8" />
    </svg>
  ),
  lowstock: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.3L3.3 10.3a1.5 1.5 0 0 0 0 2.1l7 7a1.5 1.5 0 0 0 2.1 0l7-7a1.5 1.5 0 0 0 0-2.1l-7-7a1.5 1.5 0 0 0-2.1 0z" />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h10M7 12h6M7 16h4" />
    </svg>
  ),
  "orders-new": (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  ),
  customers: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </svg>
  ),
  payments: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M2 10h20M7 15h3" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 2 4-5" />
    </svg>
  ),
  "analytics-sales": (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 8c-2 0-4 1-4 3s2 3 4 3 4 1 4 3-2 3-4 3" />
      <path d="M12 4v2M12 18v2" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  revenue: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 15l4-4 3 3 5-6" />
      <path d="M14 8h6v6" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3" />
    </svg>
  ),
  roles: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3-1 1.6 1.6 0 0 0-.3-1l.7-.7a1 1 0 0 0 0-1.4l-.7-.7a1 1 0 0 0-1.4 0l-.7.7a1.6 1.6 0 0 0-1-.3 1.6 1.6 0 0 0-1 .3l-.7-.7a1 1 0 0 0-1.4 0l-.7.7a1 1 0 0 0 0 1.4l.7.7a1.6 1.6 0 0 0-.3 1c0 .4.1.7.3 1l-.7.7a1 1 0 0 0 0 1.4l.7.7a1 1 0 0 0 1.4 0l.7-.7c.3.2.6.3 1 .3s.7-.1 1-.3l.7.7a1 1 0 0 0 1.4 0l.7-.7a1 1 0 0 0 0-1.4l-.7-.7z" />
    </svg>
  ),
  audit: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6M9 9h1" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 8a6 6 0 0 1 12 0c0 7-6 5-6 9a2 2 0 0 1-4 0c0-4-6-2-6-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  tenants: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M3 7l9-4 9 4" />
      <path d="M8 11h2M14 11h2M8 15h8" />
    </svg>
  ),
  subscriptions: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  ),
  system: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h6v6H9z" />
      <path d="M9 1v2M15 1v2M9 21v2M15 21v2M1 9h2M1 15h2M21 9h2M21 15h2" />
    </svg>
  ),
};

export function NavIcon({ name, className }: { name?: string; className?: string }) {
  if (!name || !icons[name]) {
    return (
      <span className={cn("inline-flex h-4 w-4 items-center justify-center rounded-sm bg-muted text-[10px]", className)} aria-hidden>
        •
      </span>
    );
  }
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center", className)} aria-hidden>
      {icons[name]}
    </span>
  );
}

