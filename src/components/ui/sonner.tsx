"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  // PulseOps uses CSS variables + prefers-color-scheme / .dark class — sonner inherits via --border/--popover tokens
  return (
    <Sonner
      theme={(props.theme as ToasterProps["theme"]) ?? "system"}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
