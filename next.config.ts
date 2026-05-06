// =============================================================================
// next.config.ts
// =============================================================================

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow remote images from common CDN domains for logo URLs
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
    ],
  },

  // Strict mode for better dev-time warnings
  reactStrictMode: true,

  // Required for @react-pdf/renderer (uses canvas internally)
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
};

export default nextConfig;
