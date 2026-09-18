"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SkeletonTable } from "./skeleton";
import { EmptyState } from "./empty-state";
import { Pagination } from "./pagination";

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
  accessor?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string, direction: "asc" | "desc") => void;
  getRowId?: (row: T, index: number) => string;
  onRowClick?: (row: T, index: number) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  pagination?: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void };
  className?: string;
  stickyHeader?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  emptyTitle = "No results",
  emptyDescription = "There is no data to display.",
  emptyActionLabel,
  onEmptyAction,
  sortKey,
  sortDirection,
  onSort,
  getRowId,
  onRowClick,
  pagination,
  className,
  stickyHeader = true,
}: DataTableProps<T>) {
  const handleSort = (col: Column<T>) => {
    if (!col.sortable || !onSort) return;
    const nextDir = sortKey === col.key && sortDirection === "asc" ? "desc" : "asc";
    onSort(col.key, nextDir);
  };

  if (loading) {
    return <SkeletonTable rows={6} cols={columns.length} />;
  }

  if (data.length === 0) {
    return (
      <div className={cn("rounded-xl border bg-card", className)}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
          variant="default"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="14" rx="2" />
              <path d="M7 8h10M7 12h6" />
            </svg>
          }
        />
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card shadow-xs", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={cn("bg-muted/50 text-xs", stickyHeader && "sticky top-0 z-10")}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  aria-sort={
                    col.sortable
                      ? sortKey === col.key
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                      : undefined
                  }
                  className={cn(
                    "whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide text-muted-foreground text-left",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                    col.sortable && "cursor-pointer select-none hover:text-foreground"
                  )}
                  onClick={() => handleSort(col)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {col.sortable ? (
                      <span aria-hidden className={cn("text-muted-foreground/60", sortKey === col.key && "text-foreground")}>
                        {sortKey === col.key ? (
                          sortDirection === "asc" ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="m5 15 7-7 7 7" />
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="m19 9-7 7-7-7" />
                            </svg>
                          )
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.4}>
                            <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />
                          </svg>
                        )}
                      </span>
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row, idx) => {
              const rowId = getRowId ? getRowId(row, idx) : String(idx);
              return (
                <tr
                  key={rowId}
                  onClick={() => onRowClick?.(row, idx)}
                  className={cn(
                    "bg-card transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/50",
                    "focus-within:bg-muted/30"
                  )}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onRowClick(row, idx);
                    }
                  }}
                >
                  {columns.map((col) => {
                    const content = col.render ? col.render(row, idx) : col.accessor ? col.accessor(row) : (row[col.key] as React.ReactNode);
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3 align-middle",
                          col.align === "center" && "text-center",
                          col.align === "right" && "text-right"
                        )}
                      >
                        {content ?? <span className="text-muted-foreground">—</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="border-t bg-muted/20 px-4 py-3">
          <Pagination {...pagination} />
        </div>
      ) : null}
    </div>
  );
}
