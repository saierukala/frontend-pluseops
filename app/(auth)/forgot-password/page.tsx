"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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

const forgotPasswordSchema = z.object({
  workspace: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[a-z0-9-]+$/.test(val), { message: "Workspace must be lowercase (a-z, 0-9, hyphen)" }),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      workspace: "",
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setError(null);
    setIsLoading(true);
    try {
      const slug = data.workspace?.trim() || undefined;
      await authApi.forgotPassword({ email: data.email, tenantSlug: slug });
      setIsSubmitted(true);
      toast.success("If the email exists, a reset link has been sent");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send reset link. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout>
        <AuthCard
          title="Check your email"
          description="If an account exists for that email, you'll receive a password reset link shortly."
          footer={
            <div className="space-y-4">
              <Button onClick={() => router.push("/login")} className="w-full" size="lg">
                Back to sign in
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Didn&apos;t receive the email?{" "}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Resend
                </button>
              </p>
            </div>
          }
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard
        title="Forgot password?"
        description="Enter your email and we'll send you a link to reset your password."
        footer={
          <p className="text-sm text-muted-foreground text-center">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Sign in
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
            <Label htmlFor="workspace">Workspace</Label>
            <Input
              id="workspace"
              placeholder="acme-store"
              {...register("workspace")}
              disabled={isLoading}
              aria-invalid={!!errors.workspace}
              aria-describedby={errors.workspace ? "workspace-error" : "workspace-hint"}
              autoComplete="off"
              spellCheck={false}
            />
            {errors.workspace ? (
              <p id="workspace-error" className="text-sm text-destructive" role="alert">
                {errors.workspace.message}
              </p>
            ) : (
              <p id="workspace-hint" className="text-xs text-muted-foreground">
                Optional. Leave blank if you belong to a single workspace.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
              disabled={isLoading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading} size="lg">
            {isLoading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
