import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store",
};

// Each shop renders its own header/footer in shop/[store]/layout.tsx
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return children;
}
