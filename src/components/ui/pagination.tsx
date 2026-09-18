"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "./button";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav role="navigation" aria-label="pagination" data-slot="pagination" className={cn("mx-auto flex w-full justify-center", className)} {...props} />;
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="pagination-content" className={cn("flex flex-row items-center gap-1", className)} {...props} />;
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">;

function PaginationLink({ className, isActive, size = "icon", ...props }: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(buttonVariants({ variant: isActive ? "outline" : "ghost", size }), isActive && "bg-primary text-primary-foreground border-primary", className)}
      {...props}
    />
  );
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink aria-label="Go to previous page" size="default" className={cn("gap-1 px-2.5", className)} {...props}>
      <ChevronLeftIcon className="size-4" />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  );
}

function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink aria-label="Go to next page" size="default" className={cn("gap-1 px-2.5", className)} {...props}>
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon className="size-4" />
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span aria-hidden data-slot="pagination-ellipsis" className={cn("flex size-9 items-center justify-center", className)} {...props}>
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

// PulseOps compat: existing F02 Pagination API
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

export function PaginationCompat({
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
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              aria-label="Previous page"
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeftIcon className="size-4" />
              Prev
            </Button>
          </PaginationItem>
          <span className="mx-1 hidden items-center gap-1 sm:inline-flex">
            {pages.map((p, idx) =>
              p === "…" ? (
                <PaginationEllipsis key={`e-${idx}`} />
              ) : (
                <PaginationItem key={p}>
                  <button
                    aria-label={`Go to page ${p}`}
                    aria-current={p === page ? "page" : undefined}
                    onClick={() => onPageChange(p as number)}
                    className={cn(
                      "inline-flex h-8 min-w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      p === page ? "bg-primary text-primary-foreground border-primary shadow-xs" : "bg-background hover:bg-accent hover:text-accent-foreground border-border"
                    )}
                  >
                    {p}
                  </button>
                </PaginationItem>
              )
            )}
          </span>
          <span className="mx-2 text-sm text-muted-foreground sm:hidden">Page {page} of {totalPages}</span>
          <PaginationItem>
            <Button variant="outline" size="sm" disabled={page >= totalPages} aria-label="Next page" onClick={() => onPageChange(page + 1)}>
              Next
              <ChevronRightIcon className="size-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export { PaginationCompat as Pagination };
export { Pagination as PaginationPrimitive, PaginationContent, PaginationLink, PaginationItem, PaginationPrevious, PaginationNext, PaginationEllipsis };
