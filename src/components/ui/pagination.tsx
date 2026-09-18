"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
  showSummary?: boolean;
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function paginationRange(current: number, totalPages: number, sibling = 1) {
  const totalNumbers = sibling * 2 + 5;
  if (totalPages <= totalNumbers) return range(1, totalPages);

  const left = Math.max(current - sibling, 1);
  const right = Math.min(current + sibling, totalPages);
  const showLeftEllipsis = left > 2;
  const showRightEllipsis = right < totalPages - 1;

  const result: (number | "…")[] = [1];
  if (showLeftEllipsis) result.push("…");
  result.push(...range(showLeftEllipsis ? left : 2, showRightEllipsis ? right : totalPages - 1));
  if (showRightEllipsis) result.push("…");
  result.push(totalPages);
  return result;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  siblingCount = 1,
  className,
  showSummary = true,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages = paginationRange(page, totalPages, siblingCount);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      {showSummary ? (
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{from}</span>–<span className="font-medium text-foreground">{to}</span> of{" "}
          <span className="font-medium text-foreground">{total}</span>
        </p>
      ) : (
        <span />
      )}

      <nav aria-label="Pagination" className="inline-flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          aria-label="Previous page"
          onClick={() => onPageChange(page - 1)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
          Prev
        </Button>

        <span className="mx-1 hidden items-center gap-1 sm:inline-flex">
          {pages.map((p, idx) =>
            p === "…" ? (
              <span key={`e-${idx}`} className="px-1 text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={p}
                aria-label={`Go to page ${p}`}
                aria-current={p === page ? "page" : undefined}
                onClick={() => onPageChange(p)}
                className={cn(
                  "inline-flex h-8 min-w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  p === page
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background hover:bg-accent hover:text-accent-foreground border-border"
                )}
              >
                {p}
              </button>
            )
          )}
        </span>

        {/* mobile compact indicator */}
        <span className="mx-2 text-sm text-muted-foreground sm:hidden">
          Page {page} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Button>
      </nav>
    </div>
  );
}
