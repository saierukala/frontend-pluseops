"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthCard, AuthLayout } from "@/features/auth/components/auth-layout";
import { authApi } from "@/lib/api/modules/auth";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type VerifyStatus = "pending" | "success" | "error";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<VerifyStatus>("pending");
  const [message, setMessage] = React.useState<string | null>(null);

  const token = searchParams.get("token");

  // Initialize status based on token presence
  React.useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessage("Invalid or missing verification token");
    }
  }, [token]);

  React.useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const verify = async () => {
      try {
        await authApi.verifyEmail({ token });
        if (!cancelled) {
          setStatus("success");
          setMessage("Email verified successfully! You can now sign in.");
          toast.success("Email verified successfully");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          const errMsg = err instanceof Error ? err.message : "Verification failed. The link may have expired or already been used.";
          setMessage(errMsg);
          toast.error(errMsg);
        }
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "pending") {
    return (
      <AuthLayout>
        <AuthCard title="Verifying email..." description="Please wait while we verify your email address.">
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <span className="sr-only">Verifying...</span>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  if (status === "success") {
    return (
      <AuthLayout>
        <AuthCard
          title="Email verified"
          description={message || "Your email has been verified successfully."}
          footer={
            <div className="space-y-4">
              <Button onClick={() => router.push("/login")} className="w-full" size="lg">
                Sign in
              </Button>
            </div>
          }
        >
          <div className="flex justify-center mb-4">
            <CheckCircle className={cn("h-12 w-12 text-green-500", "dark:text-green-400")} aria-hidden="true" />
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard
        title="Verification failed"
        description={message || "This verification link is invalid or has expired."}
        footer={
          <div className="space-y-4">
            <Button variant="outline" onClick={() => router.push("/login")} className="w-full" size="lg">
              Back to sign in
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Need a new verification link?{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Register again
              </Link>
            </p>
          </div>
        }
      >
        <div className="flex justify-center mb-4">
          <AlertCircle className={cn("h-12 w-12 text-destructive", "dark:text-red-400")} aria-hidden="true" />
        </div>
      </AuthCard>
    </AuthLayout>
  );
}