"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthCard, AuthLayout } from "@/features/auth/components/auth-layout";
import { useAuth } from "@/lib/auth/auth-context";
import type { AuthScope } from "@/lib/api/types";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

function isValidInternalPath(path: string): boolean {
  if (!path) return false;
  try {
    const url = new URL(path, "http://localhost");
    return url.origin === "http://localhost" && url.pathname.startsWith("/");
  } catch {
    return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
  }
}

/** Where to land after sign-in: the requested page if it belongs to the signed-in scope, else its home. */
function destinationFor(raw: string | null, scope: AuthScope | null): string {
  const platform = scope === "platform";
  if (raw && isValidInternalPath(raw) && raw.startsWith("/platform") === platform) return raw;
  return platform ? "/platform" : "/dashboard";
}

/**
 * One sign-in for everyone. The backend recognises the account from its email: business users land in their
 * own workspace, platform administrators in the platform console.
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, error: authError, isLoading, clearError } = useAuth();
  const rawRedirect = searchParams.get("redirect");

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;
  const busy = isSubmitting || isLoading;

  const onSubmit = async (data: LoginForm) => {
    try {
      const scope = await login({ email: data.email, password: data.password });
      toast.success(scope === "platform" ? "Signed in to the platform console" : "Welcome back!");
      router.push(destinationFor(rawRedirect, scope) as never);
      router.refresh();
    } catch {
      // displayed via authError
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Sign in"
        description="Use the email and password for your PulseOps account"
        footer={
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Sign up
            </Link>
          </p>
        }
      >
        {authError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="flex items-start justify-between gap-3">
              <span>{authError}</span>
              <button type="button" onClick={clearError} className="shrink-0 text-xs underline">
                Dismiss
              </button>
            </AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              {...form.register("email")}
              disabled={busy}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email ? (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...form.register("password")}
              disabled={busy}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password ? (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={busy} size="lg">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
