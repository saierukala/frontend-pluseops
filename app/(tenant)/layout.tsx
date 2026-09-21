"use client";

import * as React from "react";
import { TenantShell } from "@/components/layout/tenant-shell";
import { ProtectedRoute } from "@/features/auth/components/protected-route";

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute redirectTo="/login" requiredScope="tenant">
      <TenantShell>{children}</TenantShell>
    </ProtectedRoute>
  );
}
