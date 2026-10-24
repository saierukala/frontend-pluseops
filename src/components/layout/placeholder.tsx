"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";

/**
 * Screen for a route whose backend endpoints don't exist yet. Says so plainly instead of
 * showing fake data, and points to a working part of the app.
 */
export function ShellPlaceholder({
  title,
  description,
  backendNote,
  nextSteps,
}: {
  title: string;
  description: string;
  route?: string;
  shell?: "Tenant" | "Platform" | "Storefront";
  backendNote?: string;
  nextSteps?: { label: string; href: string }[];
}) {
  return (
    <PageBody>
      <PageHeader title={title} description={description} />
      <Card className="items-center gap-4 border-dashed px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </span>
        <div className="space-y-1.5">
          <p className="font-semibold">Coming soon</p>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">{backendNote ?? "This area is on the roadmap. Its API isn't available yet, so nothing is shown rather than placeholder data."}</p>
        </div>
        {nextSteps?.length ? (
          <div className="flex flex-wrap justify-center gap-2">
            {nextSteps.map((s) => (
              <Button key={s.href} variant="outline" size="sm" asChild>
                <Link href={s.href as never}>{s.label}</Link>
              </Button>
            ))}
          </div>
        ) : null}
      </Card>
    </PageBody>
  );
}
