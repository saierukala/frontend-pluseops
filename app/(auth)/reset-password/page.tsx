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
import { authApi } from "@/lib/api/modules/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tokenError, setTokenError] = React.useState(false);

  const token = searchParams.get("token");

  React.useEffect(() => {
    if (!token) {
      setTokenError(true);
    }
  }, [token]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password") ?? "";

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await authApi.resetPassword({ token, password: data.password });
      setIsSuccess(true);
      toast.success("Password has been reset successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password. The link may have expired.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenError) {
    return (
      <AuthLayout>
        <AuthCard
          title="Invalid reset link"
          description="This password reset link is invalid or has expired. Please request a new one."
          footer={
            <div className="space-y-4">
              <Button onClick={() => router.push("/forgot-password")} className="w-full" size="lg">
                Request new link
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Back to sign in
                </Link>
              </p>
            </div>
          }
        />
      </AuthLayout>
    );
  }

  if (isSuccess) {
    return (
      <AuthLayout>
        <AuthCard
          title="Password reset successful"
          description="Your password has been updated. You can now sign in with your new password."
          footer={
            <Button onClick={() => router.push("/login")} className="w-full" size="lg">
              Sign in
            </Button>
          }
        />
      </AuthLayout>
    );
  }

  const passwordRequirements = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { label: "One number", test: (p: string) => /[0-9]/.test(p) },
    { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];

  return (
    <AuthLayout>
      <AuthCard
        title="Reset password"
        description="Enter your new password below."
        footer={
          <p className="text-sm text-muted-foreground text-center">
            <Link
              href="/login"
              className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Back to sign in
            </Link>
          </p>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error && (
            <Alert variant="destructive" className="mb-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...register("password")}
              disabled={isLoading}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : "password-hint"}
            />
            {errors.password ? (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {errors.password.message}
              </p>
            ) : (
              <div id="password-hint" className="text-xs text-muted-foreground space-y-1" role="list" aria-label="Password requirements">
                {passwordRequirements.map((req) => (
                  <div
                    key={req.label}
                    className="flex items-center gap-1.5"
                    role="listitem"
                    aria-label={`${req.label}: ${req.test(password) ? "met" : "not met"}`}
                  >
                    <span
                      className={cn(
                        "h-3.5 w-3.5 rounded-full border flex items-center justify-center",
                        req.test(password) ? "border-green-500 text-green-500 bg-green-50" : "border-muted text-muted-foreground/50"
                      )}
                      aria-hidden="true"
                    >
                      {req.test(password) && (
                        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                    <span className={cn("text-sm", req.test(password) ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              disabled={isLoading}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
            />
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-destructive" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading} size="lg">
            {isLoading ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}