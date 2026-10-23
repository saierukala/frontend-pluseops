"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, Home, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ForbiddenExperienceProps {
  title?: string;
  description?: string;
  showBack?: boolean;
  backHref?: string;
}

export function ForbiddenExperience({
  title = "Access denied",
  description = "You are authenticated but do not have the required permission to access this resource. If you believe this is an error, please contact your administrator.",
  showBack = true,
  backHref = "/dashboard",
}: ForbiddenExperienceProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <Card className="w-full max-w-lg border-dashed shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <ShieldAlert className="h-7 w-7 text-amber-600" aria-hidden="true" />
          </div>
          <div className="mx-auto flex items-center gap-2">
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Lock className="mr-1 h-3 w-3" aria-hidden="true" /> 403
            </Badge>
            <span className="text-xs text-muted-foreground">Forbidden</span>
          </div>
          <CardTitle className="mt-3 text-2xl font-bold tracking-tight">403 — {title}</CardTitle>
          <CardDescription className="mx-auto mt-2 max-w-md text-sm leading-6">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
            <div className="font-medium text-foreground">What happened?</div>
            <p className="mt-1">
              Your session is valid and tenant-isolated, but your assigned roles do not include the required permission for this page or action.
              Direct URL access is always checked — hiding a button is never security.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {showBack ? (
              <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> Go back
              </Button>
            ) : null}
            <Button asChild className="w-full sm:w-auto">
              <Link href={backHref as never}>
                <Home className="mr-2 h-4 w-4" aria-hidden="true" /> Back to dashboard
              </Link>
            </Button>
          </div>
          <p className="text-center text-[11px] leading-4 text-muted-foreground">
            No tokens, permission internals or stack traces are exposed. If you need access, ask a tenant admin with <code className="rounded bg-muted px-1 py-0.5">role:update</code> to assign it.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
