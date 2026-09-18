"use client";

import * as React from "react";
import Link from "next/link";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav data-slot="breadcrumb" aria-label="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return <ol data-slot="breadcrumb-list" className={cn("text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5", className)} {...props} />;
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="breadcrumb-item" className={cn("inline-flex items-center gap-1.5", className)} {...props} />;
}

function BreadcrumbLink({ asChild, className, ...props }: React.ComponentProps<"a"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "a";
  return <Comp data-slot="breadcrumb-link" className={cn("hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm", className)} {...props} />;
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="breadcrumb-page" role="link" aria-disabled="true" aria-current="page" className={cn("text-foreground font-normal", className)} {...props} />;
}

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<"li">) {
  return (
    <li data-slot="breadcrumb-separator" role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} {...props}>
      {children ?? <ChevronRight />}
    </li>
  );
}

function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span data-slot="breadcrumb-ellipsis" role="presentation" aria-hidden="true" className={cn("flex size-9 items-center justify-center", className)} {...props}>
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

// PulseOps compat: <Breadcrumb items separator>
export interface BreadcrumbItemData {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItemData[];
  separator?: React.ReactNode;
}

export function BreadcrumbCompat({ className, items, separator, ...props }: BreadcrumbProps) {
  return (
    <Breadcrumb className={cn("flex", className)} {...props}>
      <BreadcrumbList>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={idx}>
              <BreadcrumbItem>
                {item.href && !isLast ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href as never}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className={cn(isLast ? "font-medium text-foreground" : "text-muted-foreground")}>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast ? (
                <BreadcrumbSeparator>{separator ?? <ChevronRight className="size-3.5" />}</BreadcrumbSeparator>
              ) : null}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export { BreadcrumbCompat as Breadcrumb };
export { Breadcrumb as BreadcrumbPrimitive, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis };
