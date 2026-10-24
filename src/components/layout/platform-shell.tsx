"use client";

import * as React from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";
import { platformNavGroups } from "./nav-config";

export function PlatformShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar kind="platform" groups={platformNavGroups} />
      <SidebarInset className="min-w-0">
        <SiteHeader kind="platform" groups={platformNavGroups} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <React.Suspense>{children}</React.Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
