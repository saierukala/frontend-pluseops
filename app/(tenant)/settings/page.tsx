"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, CheckCircle2, KeyRound, LogOut, Monitor, ShieldCheck, Smartphone, UserRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-primitive";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { Field } from "@/components/app/form-dialog";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { StatusPill } from "@/components/app/status-pill";
import { UserAvatar } from "@/components/layout/app-sidebar";
import { authApi, type AuthSession } from "@/lib/api/modules/auth";
import { WorkspaceSettingsCard } from "@/features/workspace/settings-card";
import { workspaceApi } from "@/lib/api/modules/tenants";
import { useAuth } from "@/lib/auth/auth-context";
import { usePermission } from "@/lib/auth/permission-context";
import { useUrlState } from "@/hooks/use-url-state";
import { formatDate, formatRelative, fullName, humanize } from "@/lib/format";
import { applyApiFieldErrors, toastError } from "@/lib/api-errors";

export default function SettingsPage() {
  const { get, set } = useUrlState();
  const { hasPermission } = usePermission();
  const tab = get("tab", "profile");

  return (
    <PageBody className="mx-auto w-full max-w-4xl">
      <PageHeader title="Settings" description="Manage your profile, security and workspace." />
      <Tabs value={tab} onValueChange={(t) => set({ tab: t === "profile" ? null : t })} className="gap-6">
        <TabsList>
          <TabsTrigger value="profile">
            <UserRound /> Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck /> Security
          </TabsTrigger>
          {hasPermission("tenant:read") ? (
            <TabsTrigger value="workspace">
              <Building2 /> Workspace
            </TabsTrigger>
          ) : null}
        </TabsList>
        <TabsContent value="profile" className="flex flex-col gap-6">
          <ProfileCard />
        </TabsContent>
        <TabsContent value="security" className="flex flex-col gap-6">
          <PasswordCard />
          <SessionsCard />
        </TabsContent>
        <TabsContent value="workspace" className="flex flex-col gap-6">
          <WorkspaceCard />
          <WorkspaceSettingsCard />
        </TabsContent>
      </Tabs>
    </PageBody>
  );
}

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Required").max(100),
  lastName: z.string().trim().min(1, "Required").max(100),
});

function ProfileCard() {
  const { user, refreshSession } = useAuth();
  const form = useForm<z.infer<typeof profileSchema>>({ resolver: zodResolver(profileSchema), values: { firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" } });
  const save = useMutation({
    mutationFn: (v: z.infer<typeof profileSchema>) => authApi.updateMe(v),
    onSuccess: async () => {
      await refreshSession();
      toast.success("Profile updated");
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, ["firstName", "lastName"])) toastError(e, "Couldn't update profile");
    },
  });
  const resend = useMutation({
    mutationFn: () => authApi.resendVerification(),
    onSuccess: () => toast.success("Verification email sent"),
    onError: (e) => toastError(e),
  });

  return (
    <Card>
      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} noValidate>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How you appear to teammates and in the audit log.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 pt-6">
          <div className="flex items-center gap-4">
            <UserAvatar first={user?.firstName} last={user?.lastName} className="size-14 rounded-full text-base" />
            <div>
              <p className="font-medium">{fullName(user)}</p>
              <p className="text-sm text-muted-foreground">Member since {formatDate(user?.createdAt)}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor="pf-first" error={form.formState.errors.firstName?.message}>
              <Input id="pf-first" {...form.register("firstName")} />
            </Field>
            <Field label="Last name" htmlFor="pf-last" error={form.formState.errors.lastName?.message}>
              <Input id="pf-last" {...form.register("lastName")} />
            </Field>
          </div>
          <Field label="Email" htmlFor="pf-email" hint="Contact an administrator to change your sign-in email.">
            <Input
              id="pf-email"
              value={user?.email ?? ""}
              disabled
              rightElement={
                user?.emailVerified ? (
                  <span className="flex items-center gap-1 text-xs text-success">
                    <CheckCircle2 className="size-3.5" /> Verified
                  </span>
                ) : (
                  <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => resend.mutate()}>
                    Verify
                  </button>
                )
              }
            />
          </Field>
        </CardContent>
        <CardFooter className="justify-end border-t pt-6">
          <Button type="submit" loading={save.isPending} disabled={!form.formState.isDirty}>
            Save profile
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .max(128)
      .regex(/[A-Z]/, "Add an uppercase letter")
      .regex(/[a-z]/, "Add a lowercase letter")
      .regex(/[0-9]/, "Add a number")
      .regex(/[^A-Za-z0-9]/, "Add a symbol"),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, { path: ["confirm"], message: "Passwords don't match" });
type PasswordValues = z.infer<typeof passwordSchema>;

function PasswordCard() {
  const queryClient = useQueryClient();
  const form = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: "", newPassword: "", confirm: "" } });
  const save = useMutation({
    mutationFn: (v: PasswordValues) => authApi.changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword }),
    onSuccess: () => {
      toast.success("Password changed", { description: "Other sessions were signed out." });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (e) => {
      if (!applyApiFieldErrors(e, form.setError, ["currentPassword", "newPassword"])) toastError(e, "Couldn't change password");
    },
  });
  const { errors } = form.formState;

  return (
    <Card>
      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} noValidate>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4" /> Password
          </CardTitle>
          <CardDescription>Use at least 8 characters with upper and lower case letters, a number and a symbol.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
          <Field label="Current password" htmlFor="pw-current" error={errors.currentPassword?.message}>
            <Input id="pw-current" type="password" autoComplete="current-password" {...form.register("currentPassword")} />
          </Field>
          <Field label="New password" htmlFor="pw-new" error={errors.newPassword?.message}>
            <Input id="pw-new" type="password" autoComplete="new-password" {...form.register("newPassword")} />
          </Field>
          <Field label="Confirm new password" htmlFor="pw-confirm" error={errors.confirm?.message}>
            <Input id="pw-confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
          </Field>
        </CardContent>
        <CardFooter className="justify-end border-t pt-6">
          <Button type="submit" loading={save.isPending}>
            Update password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function deviceLabel(ua: string | null) {
  if (!ua) return { name: "Unknown device", mobile: false };
  const mobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : ua.split(/[ /]/)[0];
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : null;
  return { name: os ? `${browser} on ${os}` : browser, mobile };
}

function SessionsCard() {
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const [confirmAll, setConfirmAll] = React.useState(false);
  const sessions = useQuery({ queryKey: ["sessions"], queryFn: () => authApi.listSessions() });
  const revoke = useMutation({
    mutationFn: (s: AuthSession) => authApi.revokeSession(s.id),
    onSuccess: () => {
      toast.success("Session signed out");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (e) => toastError(e),
  });
  const logoutAll = useMutation({
    mutationFn: () => authApi.logoutAll(),
    onSuccess: async () => {
      await logout();
      window.location.href = "/login";
    },
    onError: (e) => toastError(e),
  });

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="border-b pb-4">
        <CardTitle>Active sessions</CardTitle>
        <CardDescription>Devices signed in to your account. Sign out any you don&apos;t recognize.</CardDescription>
      </CardHeader>
      {sessions.isLoading ? (
        <div className="space-y-3 p-6">{Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <ul className="divide-y">
          {sessions.data?.map((s) => {
            const device = deviceLabel(s.userAgent);
            const Icon = device.mobile ? Smartphone : Monitor;
            return (
              <li key={s.id} className="flex items-center gap-4 px-6 py-4">
                <span className="flex size-10 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {device.name}
                    {s.current ? <StatusPill tone="success" label="This device" /> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.ipAddress ?? "Unknown IP"} · Active {formatRelative(s.lastUsedAt ?? s.createdAt)}
                  </p>
                </div>
                {!s.current ? (
                  <Button variant="outline" size="sm" onClick={() => revoke.mutate(s)} loading={revoke.isPending && revoke.variables?.id === s.id}>
                    Sign out
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <CardFooter className="justify-between gap-4 border-t py-4">
        <p className="text-sm text-muted-foreground">Signs out every device, including this one.</p>
        <Button variant="outline" className="text-destructive" onClick={() => setConfirmAll(true)}>
          <LogOut /> Sign out everywhere
        </Button>
      </CardFooter>
      <ConfirmDialog open={confirmAll} onOpenChange={setConfirmAll} title="Sign out of all sessions?" description="You'll need to sign in again on every device." confirmLabel="Sign out everywhere" destructive onConfirm={() => logoutAll.mutateAsync()} />
    </Card>
  );
}

function WorkspaceCard() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const workspace = useQuery({ queryKey: ["workspace"], queryFn: () => workspaceApi.get() });
  const [name, setName] = React.useState<string | null>(null);
  const value = name ?? workspace.data?.name ?? "";
  const canEdit = hasPermission("tenant:update");

  const rename = useMutation({
    mutationFn: () => workspaceApi.rename(value.trim()),
    onSuccess: (t) => {
      toast.success("Workspace renamed", { description: t.name });
      setName(null);
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
    onError: (e) => toastError(e, "Couldn't rename workspace"),
  });

  const w = workspace.data;
  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) rename.mutate();
        }}
      >
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>Plan and status are managed by PulseOps. The workspace slug is what your team types to sign in.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 pt-6">
          {workspace.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <>
              <Field label="Workspace name" htmlFor="ws-name">
                <Input id="ws-name" value={value} onChange={(e) => setName(e.target.value)} disabled={!canEdit} maxLength={255} />
              </Field>
              <dl className="grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Sign-in slug</dt>
                  <dd className="mt-1 font-mono">{w?.slug}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Plan</dt>
                  <dd className="mt-1">{humanize(w?.plan)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Status</dt>
                  <dd className="mt-1">
                    <StatusPill status={w?.status} />
                  </dd>
                </div>
              </dl>
            </>
          )}
        </CardContent>
        {canEdit ? (
          <CardFooter className="justify-end border-t pt-6">
            <Button type="submit" loading={rename.isPending} disabled={name === null || !value.trim() || value.trim() === w?.name}>
              Save
            </Button>
          </CardFooter>
        ) : null}
      </form>
    </Card>
  );
}
