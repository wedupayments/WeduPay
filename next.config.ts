import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Disabled standalone to fix _global-error prerender bug in Next.js 16 + Turbopack
  // Re-enable for Vercel deployment: output: 'standalone',
};

export default nextConfig;
