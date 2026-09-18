import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  poweredByHeader: false,
  compress: true,

  // Keep App Router typed params/helpers accurate during build.
  typescript: {
    // Fail build on type errors — F01 must stay type-safe.
    ignoreBuildErrors: false,
  },

  // Image handling — F01 foundation. Signed URLs come from backend;
  // we allow unoptimized for local storage phase and remote backend images.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },

  // Production security headers — portable, no backend coupling.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  // Env is validated via src/config/env.ts; Next inlines NEXT_PUBLIC_* only.
  // No secrets are exposed here.

  // Experimental — keep minimal for F01.
  // cacheComponents was previously flagged but not required for F01.
};

export default nextConfig;
