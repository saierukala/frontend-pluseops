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
import { toast } from "sonner";

type LoginMode = "tenant" | "platform";

const tenantLoginSchema = z.object({
  workspace: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[a-z0-9-]+$/.test(val), { message: "Workspace must be lowercase (a-z, 0-9, hyphen)" })
    .refine((val) => !val || (val.length >= 1 && val.length <= 100), { message: "Workspace must be 1-100 characters" }),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const platformLoginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type TenantForm = z.infer<typeof tenantLoginSchema>;
type PlatformForm = z.infer<typeof platformLoginSchema>;

function isValidInternalPath(path: string): boolean {
  if (!path) return false;
  try {
    const url = new URL(path, "http://localhost");
    return url.origin === "http://localhost" && url.pathname.startsWith("/");
  } catch {
    return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
  }
}

function safeRedirectForScope(raw: string | null, scope: LoginMode): string {
  if (raw && isValidInternalPath(raw)) {
    if (scope === "platform" && raw.startsWith("/platform")) return raw;
    if (scope === "tenant" && !raw.startsWith("/platform")) return raw;
    // cross-scope redirect is not allowed — fall through to default
  }
  return scope === "platform" ? "/platform" : "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, error: authError, isLoading, clearError } = useAuth();

  const rawRedirect = searchParams.get("redirect");
  const initialMode = (searchParams.get("mode") === "platform" ? "platform" : "tenant") as LoginMode;
  const [mode, setMode] = React.useState<LoginMode>(initialMode);

  const tenantForm = useForm<TenantForm>({
    resolver: zodResolver(tenantLoginSchema),
    defaultValues: { workspace: "", email: "", password: "" },
  });

  const platformForm = useForm<PlatformForm>({
    resolver: zodResolver(platformLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onTenantSubmit = async (data: TenantForm) => {
    try {
      const redirectTo = safeRedirectForScope(rawRedirect, "tenant");
      const slug = data.workspace?.trim() || undefined;
      await login({ email: data.email, password: data.password, scope: "tenant", tenantSlug: slug });
      toast.success("Welcome back!");
      router.push(redirectTo as never);
      router.refresh();
    } catch {
      // displayed via authError
    }
  };

  const onPlatformSubmit = async (data: PlatformForm) => {
    try {
      const redirectTo = safeRedirectForScope(rawRedirect, "platform");
      await login({ email: data.email, password: data.password, scope: "platform" });
      toast.success("Platform access granted");
      router.push(redirectTo as never);
      router.refresh();
    } catch {
      // displayed via authError
    }
  };

  const handleModeChange = (v: string) => {
    clearError();
    setMode(v as LoginMode);
  };

  return (
    <AuthLayout>
      <AuthCard
        title="Sign in"
        description="Choose your workspace and enter your credentials"
        footer={
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Sign up
              </Link>
            </p>
            <p className="text-center text-xs text-muted-foreground">Platform administrators use Platform Admin. Business users use Tenant / Business.</p>
          </div>
        }
      >
        <div className="grid w-full grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => handleModeChange("tenant")}
              aria-pressed={mode === "tenant"}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${mode === "tenant" ? "bg-background shadow-sm text-foreground border" : "text-muted-foreground hover:text-foreground"}`}
            >
              Tenant / Business
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("platform")}
              aria-pressed={mode === "platform"}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${mode === "platform" ? "bg-background shadow-sm text-foreground border" : "text-muted-foreground hover:text-foreground"}`}
            >
              Platform Admin
            </button>
          </div>

          {(authError) && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          {authError && (
            <button
              type="button"
              onClick={clearError}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground underline"
            >
              Dismiss
            </button>
          )}

          {mode === "tenant" ? (
            <div className="mt-4">
            <form onSubmit={tenantForm.handleSubmit(onTenantSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="workspace">Workspace</Label>
                <Input
                  id="workspace"
                  placeholder="acme-store"
                  {...tenantForm.register("workspace")}
                  disabled={tenantForm.formState.isSubmitting || isLoading}
                  aria-invalid={!!tenantForm.formState.errors.workspace}
                  aria-describedby={tenantForm.formState.errors.workspace ? "workspace-error" : "workspace-hint"}
                  autoComplete="off"
                  spellCheck={false}
                />
                {tenantForm.formState.errors.workspace ? (
                  <p id="workspace-error" className="text-sm text-destructive" role="alert">
                    {tenantForm.formState.errors.workspace.message}
                  </p>
                ) : (
                  <p id="workspace-hint" className="text-xs text-muted-foreground">
                    Your workspace slug (e.g. <code className="rounded bg-muted px-1">acme-store</code>). Leave blank if you belong to a single
                    workspace — we&apos;ll resolve it.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-email">Email</Label>
                <Input
                  id="tenant-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...tenantForm.register("email")}
                  disabled={tenantForm.formState.isSubmitting || isLoading}
                  aria-invalid={!!tenantForm.formState.errors.email}
                  aria-describedby={tenantForm.formState.errors.email ? "tenant-email-error" : undefined}
                />
                {tenantForm.formState.errors.email && (
                  <p id="tenant-email-error" className="text-sm text-destructive" role="alert">
                    {tenantForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tenant-password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="tenant-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...tenantForm.register("password")}
                  disabled={tenantForm.formState.isSubmitting || isLoading}
                  aria-invalid={!!tenantForm.formState.errors.password}
                  aria-describedby={tenantForm.formState.errors.password ? "tenant-password-error" : undefined}
                />
                {tenantForm.formState.errors.password && (
                  <p id="tenant-password-error" className="text-sm text-destructive" role="alert">
                    {tenantForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={tenantForm.formState.isSubmitting || isLoading} size="lg">
                {tenantForm.formState.isSubmitting || isLoading ? "Signing in..." : "Sign in to workspace"}
              </Button>
            </form>
            </div>
          ) : (
            <div className="mt-4">
            <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs leading-5 text-amber-900 dark:text-amber-200">
              Platform administration — global access to tenant management. Tenant credentials cannot access this mode.
            </div>
            <form onSubmit={platformForm.handleSubmit(onPlatformSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="platform-email">Email</Label>
                <Input
                  id="platform-email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@pulseops.internal"
                  {...platformForm.register("email")}
                  disabled={platformForm.formState.isSubmitting || isLoading}
                  aria-invalid={!!platformForm.formState.errors.email}
                  aria-describedby={platformForm.formState.errors.email ? "platform-email-error" : undefined}
                />
                {platformForm.formState.errors.email && (
                  <p id="platform-email-error" className="text-sm text-destructive" role="alert">
                    {platformForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform-password">Password</Label>
                <Input
                  id="platform-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...platformForm.register("password")}
                  disabled={platformForm.formState.isSubmitting || isLoading}
                  aria-invalid={!!platformForm.formState.errors.password}
                  aria-describedby={platformForm.formState.errors.password ? "platform-password-error" : undefined}
                />
                {platformForm.formState.errors.password && (
                  <p id="platform-password-error" className="text-sm text-destructive" role="alert">
                    {platformForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={platformForm.formState.isSubmitting || isLoading} size="lg">
                {platformForm.formState.isSubmitting || isLoading ? "Signing in..." : "Sign in to platform"}
              </Button>
            </form>
            </div>
          )}
      </AuthCard>
    </AuthLayout>
  );
}
