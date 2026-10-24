"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useUrlState } from "@/hooks/use-url-state";

export const RANGES = {
  "7d": { label: "7 days", days: 7, groupBy: "day" },
  "30d": { label: "30 days", days: 30, groupBy: "day" },
  "90d": { label: "90 days", days: 90, groupBy: "week" },
  "12m": { label: "12 months", days: 365, groupBy: "month" },
} as const;
export type RangeKey = keyof typeof RANGES;

/** Selected reporting window, kept in the URL (?range=30d). */
export function useAnalyticsRange() {
  const { get, set } = useUrlState();
  const key = (get("range", "30d") in RANGES ? get("range", "30d") : "30d") as RangeKey;
  const range = RANGES[key];
  const from = format(subDays(new Date(), range.days - 1), "yyyy-MM-dd");
  return { key, range, from, groupBy: range.groupBy, params: { from, groupBy: range.groupBy }, setKey: (k: RangeKey) => set({ range: k }) };
}

export function RangeToggle() {
  const { key, setKey } = useAnalyticsRange();
  return (
    <ToggleGroup type="single" variant="outline" size="sm" value={key} onValueChange={(v) => v && setKey(v as RangeKey)} aria-label="Reporting period">
      {(Object.keys(RANGES) as RangeKey[]).map((k) => (
        <ToggleGroupItem key={k} value={k} className="px-3 text-xs">
          {RANGES[k].label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** Formats a bucket start for the axis based on the grouping. */
export function bucketLabel(bucket: string | null, groupBy: string, long = false): string {
  if (!bucket) return "All time";
  const d = new Date(bucket);
  if (groupBy === "month") return format(d, long ? "MMMM yyyy" : "MMM yy");
  if (groupBy === "week") return `${long ? "Week of " : ""}${format(d, "MMM d")}`;
  return format(d, long ? "EEE, MMM d" : "MMM d");
}
