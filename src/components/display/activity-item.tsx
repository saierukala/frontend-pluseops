"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { DateDisplay } from "./date-display";

export interface ActivityItemProps extends React.HTMLAttributes<HTMLDivElement> {
  actor?: { name: string; avatar?: string };
  action: string;
  target?: string;
  timestamp: Date | string | number;
  icon?: React.ReactNode;
  description?: string;
}

export function ActivityItem({
  className,
  actor,
  action,
  target,
  timestamp,
  icon,
  description,
  ...props
}: ActivityItemProps) {
  return (
    <div className={cn("flex gap-3 rounded-lg p-3 hover:bg-muted/40 transition-colors", className)} {...props}>
      {actor ? (
        <Avatar src={actor.avatar} alt={actor.name} fallback={actor.name} size="sm" />
      ) : icon ? (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0">
          {icon}
        </span>
      ) : null}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-5">
          {actor ? <span className="font-medium">{actor.name}</span> : null} <span className="text-muted-foreground">{action}</span>{" "}
          {target ? <span className="font-medium">{target}</span> : null}
        </p>
        {description ? <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p> : null}
        <DateDisplay value={timestamp} relative className="mt-1 text-xs text-muted-foreground" />
      </div>
    </div>
  );
}
