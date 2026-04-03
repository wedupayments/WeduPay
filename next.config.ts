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
  // Disable static page generation - use SSR only
  // This prevents build-time errors with context
  output: 'standalone',
  
  // Use webpack instead of Turbopack to avoid context issues
  // webpack: (config) => {
  //   return config;
  // },
};

export default nextConfig;
