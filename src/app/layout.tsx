import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import { VercelAnalytics } from "@/shared/components/VercelAnalytics";
import { Providers } from "@/app/providers";
import { PWAInstallPrompt } from "@/shared/components/PWAInstallPrompt";
import { ServiceWorkerRegistration } from "@/shared/components/ServiceWorkerRegistration";

// Force dynamic rendering to avoid static generation issues with context
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Removed next/font/google to avoid build-time network issues
// const inter = Inter({ ... });
const inter = { variable: "font-sans" };

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const metadataBase = new URL(appUrl);

export const metadata: Metadata = {
  metadataBase,
  applicationName: "WeduPay",
  manifest: "/manifest.webmanifest",
  title: "WeduPay | Secure Payment Routing for Africa and Beyond",
  description: "Secure payment routing for mobile wallets in Africa and beyond",
  keywords: [
    "WeduPay",
    "payments",
    "Africa",
    "mobile wallets",
    "cross-border payments",
    "virtual cards",
    "fintech",
  ],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/logo-slack.png",
  },
  openGraph: {
    type: "website",
    url: appUrl,
    siteName: "WeduPay",
    title: "WeduPay | Secure Payment Routing for Africa and Beyond",
    description: "Secure payment routing for mobile wallets, transfers, and virtual cards across Africa.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 343,
        alt: "WeduPay logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WeduPay | Secure Payment Routing for Africa and Beyond",
    description: "Secure payment routing for mobile wallets, transfers, and virtual cards across Africa.",
    images: ["/logo.png"],
  },
  other: {
    "msapplication-TileImage": "/logo-slack.png",
    "msapplication-TileColor": "#102219",
    "mobile-web-app-capable": "yes",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WeduPay",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#102219" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body className={`${inter.variable} bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display`}>
        <Providers>
          {children}
          <PWAInstallPrompt />
          <ServiceWorkerRegistration />
          <VercelAnalytics />
        </Providers>
      </body>
    </html>
  );
}
