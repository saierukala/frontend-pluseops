"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectRoot, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PaginationMeta } from "@/lib/api/pagination";
import { formatNumber } from "@/lib/format";
import { EmptyState, ErrorState } from "./states";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

/**
 * Server-driven table: rows, loading/error/empty states and page controls. Filtering, sorting and
 * paging state lives in the page (usually in the query key) so the API stays the source of truth.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  meta,
  onPageChange,
  onRowClick,
  empty,
  skeletonRows = 6,
  className,
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
  skeletonRows?: number;
  className?: string;
}) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />;

  const showSkeleton = loading && !rows;

  return (
    <div className={cn("flex flex-col", className)}>
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => (
              <TableHead key={col.key} className={cn("h-10 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground first:pl-5 last:pr-5", col.headerClassName)}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {showSkeleton
            ? Array.from({ length: skeletonRows }, (_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {columns.map((col) => (
                    <TableCell key={col.key} className="px-4 py-3.5 first:pl-5 last:pr-5">
                      <Skeleton className="h-4 w-full max-w-36" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows?.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn("group", onRowClick && "cursor-pointer")}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={cn("px-4 py-3 first:pl-5 last:pr-5", col.className)}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>
      {!showSkeleton && rows && rows.length === 0 ? empty ?? <EmptyState title="Nothing here yet" /> : null}
      {meta && onPageChange && meta.total > 0 ? <Pager meta={meta} onPageChange={onPageChange} loading={loading} /> : null}
    </div>
  );
}

function Pager({ meta, onPageChange, loading }: { meta: PaginationMeta; onPageChange: (page: number) => void; loading?: boolean }) {
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);
  return (
    <div className="flex items-center justify-between gap-3 border-t px-5 py-3 text-sm text-muted-foreground">
      <span className="tabular">
        {formatNumber(from)}–{formatNumber(to)} of {formatNumber(meta.total)}
      </span>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="icon" className="size-8" aria-label="Previous page" disabled={meta.page <= 1 || loading} onClick={() => onPageChange(meta.page - 1)}>
          <ChevronLeft />
        </Button>
        <span className="tabular min-w-16 text-center text-xs">
          Page {meta.page} of {Math.max(meta.totalPages, 1)}
        </span>
        <Button variant="outline" size="icon" className="size-8" aria-label="Next page" disabled={meta.page >= meta.totalPages || loading} onClick={() => onPageChange(meta.page + 1)}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

export function TableToolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-2 border-b px-5 py-3 sm:flex-row sm:items-center", className)}>{children}</div>;
}

/** Debounced search box; calls onChange 300ms after the user stops typing. */
export function SearchInput({ value, onChange, placeholder = "Search…", className }: { value: string; onChange: (value: string) => void; placeholder?: string; className?: string }) {
  const [draft, setDraft] = React.useState(value);
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  });
  React.useEffect(() => {
    if (draft === value) return;
    const t = setTimeout(() => onChangeRef.current(draft), 300);
    return () => clearTimeout(t);
  }, [draft, value]);

  return (
    <div className={cn("w-full sm:max-w-xs", className)}>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        leftElement={<Search className="size-4" />}
        rightElement={
          draft ? (
            <button type="button" aria-label="Clear search" className="text-muted-foreground hover:text-foreground" onClick={() => setDraft("")}>
              <X className="size-3.5" />
            </button>
          ) : null
        }
      />
    </div>
  );
}

export const ALL = "all";

/** Compact filter dropdown; the "all" value means no filter. */
export function FilterSelect({
  value,
  onChange,
  options,
  allLabel,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  allLabel: string;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <SelectRoot value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("h-9 w-full sm:w-44", className)} aria-label={ariaLabel ?? allLabel}>
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}
