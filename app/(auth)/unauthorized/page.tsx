"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthLayout } from "@/features/auth/components/auth-layout";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <AuthLayout>
      <AuthCard
        title="Sign in required"
        description="You need to be signed in to access this page. Please sign in or create an account."
        footer={
          <div className="space-y-4">
            <Button onClick={() => router.push("/login")} className="w-full" size="lg">
              Sign in
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Sign up
              </Link>
            </p>
          </div>
        }
      >
        <div className="flex justify-center mb-4">
          <div className={cn("h-12 w-12 rounded-full bg-muted flex items-center justify-center")}>
            <Lock className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}