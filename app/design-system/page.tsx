import type { Metadata } from "next";
import DesignSystemClient from "./client";

export const metadata: Metadata = {
  title: "Design System — PulseOps",
  description: "PulseOps reusable UI design system — F02 showcase. Verify variants, dark mode, keyboard, responsive behavior.",
};

export default function DesignSystemPage() {
  return <DesignSystemClient />;
}
