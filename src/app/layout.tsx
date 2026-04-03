import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { VercelAnalytics } from "@/components/VercelAnalytics";
import { Providers } from "@/app/providers";

// Force dynamic rendering to avoid static generation issues with context
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "WeduPay | Secure Payment Routing for Africa and Beyond",
  description: "Secure payment routing for mobile wallets in Africa and beyond",
  icons: {
    icon: "/favicon.svg",
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body className={`${inter.variable} bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display`}>
        <Providers>
          {children}
          <VercelAnalytics />
        </Providers>
      </body>
    </html>
  );
}
