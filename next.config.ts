import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Use remotePatterns (preferred) to explicitly allow external image hosts.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  output: 'standalone',
};

export default nextConfig;
