import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WeduPay",
    short_name: "WeduPay",
    description: "Secure payment routing for mobile wallets, transfers, and virtual cards across Africa.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#102219",
    theme_color: "#102219",
    categories: ["finance", "business", "productivity"],
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/logo-slack.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-slack.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Customer Dashboard",
        short_name: "Customer",
        description: "Open customer wallets, cards, and transfers.",
        url: "/dashboard/customer",
        icons: [{ src: "/logo-slack.png", sizes: "512x512" }],
      },
      {
        name: "Merchant Dashboard",
        short_name: "Merchant",
        description: "Open merchant payments and payment links.",
        url: "/dashboard/merchant",
        icons: [{ src: "/logo-slack.png", sizes: "512x512" }],
      },
    ],
  };
}
