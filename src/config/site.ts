import { publicEnv } from "./env";

export const siteConfig = {
  name: publicEnv.appName,
  title: "PulseOps — Business Operations Platform",
  description:
    "PulseOps is a multi-tenant business operations platform — catalog, inventory, orders, payments, analytics, and realtime operations in one coherent product.",
  url: publicEnv.appUrl,
  ogImage: `${publicEnv.appUrl}/og-image.png`,
  links: {
    docs: "https://pulseops.example.com/docs",
    github: "https://github.com/pulseops",
  },
  creator: "PulseOps",
  keywords: ["PulseOps", "SaaS", "Operations", "Inventory", "Orders", "Dashboard", "Multi-tenant"],
} as const;

export type SiteConfig = typeof siteConfig;
