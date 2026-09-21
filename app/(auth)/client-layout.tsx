"use client";

import * as React from "react";
import { AuthGuard } from "@/features/auth/components/protected-route";

export default function AuthClientLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
