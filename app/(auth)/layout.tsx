import type { Metadata } from "next";
import AuthClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "Authentication",
};

export default function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <AuthClientLayout>{children}</AuthClientLayout>;
}