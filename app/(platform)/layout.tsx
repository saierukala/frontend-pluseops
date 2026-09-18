import type { Metadata } from "next";
import { PlatformShell } from "@/components/layout/platform-shell";

export const metadata: Metadata = {
  title: "Platform",
};

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>;
}

