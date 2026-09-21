"use client";

import * as React from "react";
import { PlatformShell } from "@/components/layout/platform-shell";
import { ProtectedRoute } from "@/features/auth/components/protected-route";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute redirectTo="/login" requiredScope="platform">
      <PlatformShell>{children}</PlatformShell>
    </ProtectedRoute>
  );
}
