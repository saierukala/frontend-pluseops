"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { PulseOpsBrand } from "@/components/layout/brand";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <PulseOpsBrand className="h-10 w-auto" />
        </div>
        <Card className="shadow-xl">{children}</Card>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} PulseOps. All rights reserved.
        </p>
      </div>
    </div>
  );
}

interface AuthCardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      <div>{children}</div>
      {footer && (
        <div className="mt-6">{footer}</div>
      )}
    </div>
  );
}