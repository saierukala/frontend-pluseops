"use client";

import { ForbiddenExperience } from "@/components/auth/forbidden-experience";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
      <ForbiddenExperience />
    </div>
  );
}