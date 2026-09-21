"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthLayout } from "@/features/auth/components/auth-layout";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <AuthLayout>
      <AuthCard
        title="Access denied"
        description="You don&apos;t have permission to access this page. If you believe this is an error, please contact your administrator."
        footer={
          <div className="space-y-4">
            <Button variant="outline" onClick={() => router.back()} className="w-full" size="lg">
              Go back
            </Button>
            <Button onClick={() => router.push("/dashboard")} className="w-full" size="lg">
              Go to dashboard
            </Button>
          </div>
        }
      >
        <div className="flex justify-center mb-4">
          <div className={cn("h-12 w-12 rounded-full bg-muted flex items-center justify-center")}>
            <ShieldAlert className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}