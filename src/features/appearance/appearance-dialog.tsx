"use client";

import { DialogContent, DialogDescription, DialogHeader, DialogRoot, DialogTitle } from "@/components/ui/dialog";
import { AppearanceSettings } from "./appearance-settings";

export function AppearanceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Appearance</DialogTitle>
          <DialogDescription>Saved in this browser. Everyone else keeps their own look.</DialogDescription>
        </DialogHeader>
        <AppearanceSettings />
      </DialogContent>
    </DialogRoot>
  );
}
