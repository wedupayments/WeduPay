/**
 * Vercel Analytics Component
 * 
 * Enables Vercel Analytics for tracking page views and performance.
 * Add to your root layout to enable analytics.
 * 
 * @example
 * ```tsx
 * // In layout.tsx
 * import { VercelAnalytics } from '@/components/VercelAnalytics';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <VercelAnalytics />
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */

'use client';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export function VercelAnalytics() {
  return (
    <>
      {/* Vercel Analytics - Tracks page views, clicks, and navigation */}
      <Analytics />
      
      {/* Vercel Speed Insights - Tracks Core Web Vitals */}
      <SpeedInsights />
    </>
  );
}
