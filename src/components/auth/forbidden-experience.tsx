"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, Home, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ForbiddenExperienceProps {
  title?: string;
  description?: string;
  showBack?: boolean;
  backHref?: string;
  /** The boxed "what to do" line; defaults to asking a workspace admin. */
  hint?: string;
  backLabel?: string;
}

export function ForbiddenExperience({
  title = "Access denied",
  description = "You’re signed in, but this page isn’t available to your role.",
  showBack = true,
  backHref = "/dashboard",
  hint = "Your role doesn’t include this page. Ask an admin in your workspace to give you access.",
  backLabel = "Back to dashboard",
}: ForbiddenExperienceProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <Card className="w-full max-w-lg border-dashed shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <ShieldAlert className="h-7 w-7 text-amber-600" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
          <CardDescription className="mx-auto mt-2 max-w-md text-sm leading-6">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
            <Lock className="mr-1.5 inline size-3.5 align-[-2px]" aria-hidden="true" />
            {hint}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {showBack ? (
              <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> Go back
              </Button>
            ) : null}
            <Button asChild className="w-full sm:w-auto">
              <Link href={backHref as never}>
                <Home className="mr-2 h-4 w-4" aria-hidden="true" /> {backLabel}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
