"use client";

import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { PosScreen } from "@/features/pos/pos-screen";

/** Full-screen counter billing (no sidebar), for cashiers with `pos:sell`. */
export default function PosPage() {
  return (
    <ProtectedRoute redirectTo="/login" requiredScope="tenant" requiredPermission="pos:sell">
      <PosScreen />
    </ProtectedRoute>
  );
}
