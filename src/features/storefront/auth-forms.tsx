"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/app/form-dialog";
import { applyApiFieldErrors, errorMessage } from "@/lib/api-errors";
import { useShop } from "./shop-context";

function AuthCard({ title, description, children, footer }: { title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-6 sm:py-12">
      <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </div>
      {footer ? <p className="text-center text-sm text-muted-foreground">{footer}</p> : null}
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  return message ? (
    <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
      {message}
    </p>
  ) : null;
}

/** Only same-store relative paths are accepted as ?next= targets. */
function useNext(fallback: string) {
  const params = useSearchParams();
  const { href } = useShop();
  const next = params.get("next");
  return next && next.startsWith(href()) && !next.startsWith("//") ? next : fallback;
}

const password = z
  .string()
  .min(8, "At least 8 characters")
  .max(128)
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[0-9]/, "Add a number")
  .regex(/[^A-Za-z0-9]/, "Add a symbol");

// ─── Sign in ────────────────────────────────────────────────────────────────

const loginSchema = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(1, "Enter your password") });

export function ShopLoginForm() {
  const { client, href, store, slug } = useShop();
  const router = useRouter();
  const queryClient = useQueryClient();
  const next = useNext(href());
  const [error, setError] = React.useState<string | null>(null);
  const form = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const login = useMutation({
    mutationFn: (v: z.infer<typeof loginSchema>) => client.login(v.email, v.password),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["shop", slug] });
      toast.success(`Welcome back, ${customer.firstName}`);
      router.replace(next as never);
    },
    onError: (e) => setError(errorMessage(e, "Couldn't sign you in")),
  });
  const { errors } = form.formState;

  return (
    <AuthCard
      title={`Sign in to ${store.name}`}
      description="Track orders and check out faster."
      footer={
        <>
          New here?{" "}
          <Link href={`${href("/register")}${next !== href() ? `?next=${encodeURIComponent(next)}` : ""}` as never} className="font-medium text-foreground hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" noValidate onSubmit={form.handleSubmit((v) => { setError(null); login.mutate(v); })}>
        <Field label="Email" htmlFor="sl-email" error={errors.email?.message}>
          <Input id="sl-email" type="email" autoComplete="email" autoFocus {...form.register("email")} />
        </Field>
        <Field label="Password" htmlFor="sl-password" error={errors.password?.message}>
          <Input id="sl-password" type="password" autoComplete="current-password" {...form.register("password")} />
        </Field>
        <Link href={href("/forgot-password") as never} className="-mt-2 self-end text-sm text-muted-foreground hover:text-foreground">
          Forgot password?
        </Link>
        <FormError message={error} />
        <Button type="submit" size="lg" className="rounded-full" loading={login.isPending}>
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}

// ─── Create account ─────────────────────────────────────────────────────────

const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Required").max(100),
  lastName: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().email("Enter a valid email"),
});

/** After a register/forgot request: tells the shopper to check email; in development the API returns the code directly. */
function CheckEmail({ email, devToken, next }: { email: string; devToken?: string; next: string }) {
  const { href } = useShop();
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <MailCheck className="size-5" />
      </span>
      <p className="text-sm text-muted-foreground">
        If <span className="font-medium text-foreground">{email}</span> can be used, we&apos;ve sent a link to set your password. The link expires, so use it soon.
      </p>
      {devToken ? (
        <Button variant="outline" asChild>
          <Link href={`${href("/set-password")}?token=${devToken}&next=${encodeURIComponent(next)}` as never}>Continue (development mode)</Link>
        </Button>
      ) : null}
    </div>
  );
}

export function ShopRegisterForm() {
  const { client, href, store } = useShop();
  const next = useNext(href());
  const [sent, setSent] = React.useState<{ email: string; devToken?: string } | null>(null);
  const form = useForm<z.infer<typeof registerSchema>>({ resolver: zodResolver(registerSchema), defaultValues: { firstName: "", lastName: "", email: "" } });
  const register = useMutation({
    mutationFn: (v: z.infer<typeof registerSchema>) => client.register(v),
    onSuccess: (res, v) => setSent({ email: v.email, devToken: res.devToken }),
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, ["firstName", "lastName", "email"])) form.setError("root", { message: errorMessage(e) });
    },
  });
  const { errors } = form.formState;

  return (
    <AuthCard
      title={sent ? "Check your email" : `Create your ${store.name} account`}
      description={sent ? undefined : "We'll email you a link to choose a password."}
      footer={
        sent ? null : (
          <>
            Already have an account?{" "}
            <Link href={href("/login") as never} className="font-medium text-foreground hover:underline">
              Sign in
            </Link>
          </>
        )
      }
    >
      {sent ? (
        <CheckEmail email={sent.email} devToken={sent.devToken} next={next} />
      ) : (
        <form className="flex flex-col gap-4" noValidate onSubmit={form.handleSubmit((v) => register.mutate(v))}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" htmlFor="sr-first" error={errors.firstName?.message}>
              <Input id="sr-first" autoComplete="given-name" autoFocus {...form.register("firstName")} />
            </Field>
            <Field label="Last name" htmlFor="sr-last" error={errors.lastName?.message}>
              <Input id="sr-last" autoComplete="family-name" {...form.register("lastName")} />
            </Field>
          </div>
          <Field label="Email" htmlFor="sr-email" error={errors.email?.message}>
            <Input id="sr-email" type="email" autoComplete="email" {...form.register("email")} />
          </Field>
          <FormError message={errors.root?.message ?? null} />
          <Button type="submit" size="lg" className="rounded-full" loading={register.isPending}>
            Continue
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

// ─── Forgot password ────────────────────────────────────────────────────────

export function ShopForgotPasswordForm() {
  const { client, href } = useShop();
  const [sent, setSent] = React.useState<{ email: string; devToken?: string } | null>(null);
  const form = useForm<{ email: string }>({ resolver: zodResolver(z.object({ email: z.string().trim().email("Enter a valid email") })), defaultValues: { email: "" } });
  const forgot = useMutation({
    mutationFn: (v: { email: string }) => client.forgotPassword(v.email),
    onSuccess: (res, v) => setSent({ email: v.email, devToken: res.devToken }),
    onError: (e) => form.setError("root", { message: errorMessage(e) }),
  });

  return (
    <AuthCard
      title={sent ? "Check your email" : "Reset your password"}
      description={sent ? undefined : "Enter your account email and we'll send you a reset link."}
      footer={
        <Link href={href("/login") as never} className="font-medium text-foreground hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <CheckEmail email={sent.email} devToken={sent.devToken} next={href("/account")} />
      ) : (
        <form className="flex flex-col gap-4" noValidate onSubmit={form.handleSubmit((v) => forgot.mutate(v))}>
          <Field label="Email" htmlFor="sf-email" error={form.formState.errors.email?.message}>
            <Input id="sf-email" type="email" autoComplete="email" autoFocus {...form.register("email")} />
          </Field>
          <FormError message={form.formState.errors.root?.message ?? null} />
          <Button type="submit" size="lg" className="rounded-full" loading={forgot.isPending}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

// ─── Set password (from the emailed link) ───────────────────────────────────

const setPasswordSchema = z.object({ password, confirm: z.string() }).refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });

export function ShopSetPasswordForm() {
  const { client, href, slug } = useShop();
  const params = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = params.get("token") ?? "";
  const next = useNext(href("/account"));
  const [error, setError] = React.useState<string | null>(null);
  const form = useForm<z.infer<typeof setPasswordSchema>>({ resolver: zodResolver(setPasswordSchema), defaultValues: { password: "", confirm: "" } });
  const save = useMutation({
    mutationFn: (v: z.infer<typeof setPasswordSchema>) => client.setPassword(token, v.password),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["shop", slug] });
      toast.success(`You're signed in, ${customer.firstName}`);
      router.replace(next as never);
    },
    onError: (e) => setError(errorMessage(e, "This link is invalid or has expired")),
  });
  const { errors } = form.formState;

  if (!token) {
    return (
      <AuthCard title="Link incomplete" description="Open the link from your email again, or request a new one.">
        <Button asChild className="w-full rounded-full">
          <Link href={href("/forgot-password") as never}>Request a new link</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a password" description="At least 8 characters with upper and lower case letters, a number and a symbol.">
      <form className="flex flex-col gap-4" noValidate onSubmit={form.handleSubmit((v) => { setError(null); save.mutate(v); })}>
        <Field label="New password" htmlFor="sp-password" error={errors.password?.message}>
          <Input id="sp-password" type="password" autoComplete="new-password" autoFocus {...form.register("password")} />
        </Field>
        <Field label="Confirm password" htmlFor="sp-confirm" error={errors.confirm?.message}>
          <Input id="sp-confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
        </Field>
        <FormError message={error} />
        <Button type="submit" size="lg" className="rounded-full" loading={save.isPending}>
          Save and sign in
        </Button>
      </form>
    </AuthCard>
  );
}
