import type { Metadata } from "next";
import { TenantShell } from "@/components/layout/tenant-shell";

export const metadata: Metadata = {
  title: "Tenant",
};

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return <TenantShell>{children}</TenantShell>;
}

