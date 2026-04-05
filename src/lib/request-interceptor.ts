/**
 * Request Interception Layer (Proxy)
 *
 * Centralized request processing pipeline that enforces:
 * - Authentication verification
 * - IP filtering (allowlist/blocklist)
 * - Rate limiting
 * - Bot detection
 * - Device fingerprinting
 * - Request validation
 *
 * Implemented as Next.js middleware enhancement.
 *
 * @module lib/request-interceptor
 */

import { NextRequest, NextResponse } from "next/server";
import { extractClientIP, filterIP } from "@/lib/ip-filter";
import { generateDeviceFingerprint, extractFingerprintFromHeaders } from "@/lib/device-fingerprint";
import { checkRateLimit } from "@/lib/rate-limit";

// ============================================================
// Configuration
// ============================================================

/**
 * IP allowlist for webhook endpoints
 * Payment providers must send webhooks from these IPs
 */
const WEBHOOK_IP_ALLOWLIST: string[] = [
  // M-Pesa (Safaricom)
  "196.216.0.0/14",
  // Flutterwave
  "3.223.0.0/16",
  "52.206.0.0/16",
  // Paystack
  "52.31.0.0/16",
  // EcoCash
  "196.46.0.0/16",
];

/**
 * Known bot user agents to block
 */
const BLOCKED_BOT_AGENTS = [
  "Googlebot",
  "Bingbot",
  "Baiduspider",
  "YandexBot",
  "DuckDuckBot",
  "Slurp",
  "Sogou",
  "Exabot",
  "facebot",
  "ia_archiver",
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "PetalBot",
  "Scrapy",
  "python-requests",
  "Go-http-client",
  "curl/",
  "wget/",
];

/**
 * Rate limit configurations per endpoint pattern
 */
const RATE_LIMITS: Record<string, { window: number; max: number }> = {
  "/api/auth/": { window: 60, max: 10 }, // 10 req/min for auth
  "/api/payments": { window: 60, max: 30 }, // 30 req/min for payments
  "/api/transfers": { window: 60, max: 30 }, // 30 req/min for transfers
  "/api/cards": { window: 60, max: 20 }, // 20 req/min for cards
  "/api/webhooks/": { window: 60, max: 100 }, // 100 req/min for webhooks
  "/api/": { window: 60, max: 100 }, // 100 req/min default
};

/**
 * Paths exempt from authentication
 */
const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/callback",
  "/api/waitlist",
  "/api/docs",
  "/api/docs.json",
  "/terms",
  "/privacy",
];

// ============================================================
// Interception Pipeline
// ============================================================

export interface InterceptionResult {
  passed: boolean;
  response?: NextResponse;
  metadata: RequestMetadata;
}

export interface RequestMetadata {
  clientIP: string | null;
  deviceFingerprint?: string;
  isBot: boolean;
  userAgent?: string;
  rateLimitKey?: string;
  rateLimitRemaining?: number;
  ipAllowed: boolean;
  isAuthenticated: boolean;
  processingTimeMs: number;
}

/**
 * Process a request through the interception pipeline
 *
 * Runs all security checks in sequence and returns the result.
 * If any check fails, returns a rejection response.
 *
 * @param request - The incoming Next.js request
 * @returns InterceptionResult with pass/fail decision
 */
export async function interceptRequest(
  request: NextRequest
): Promise<InterceptionResult> {
  const startTime = Date.now();
  const pathname = request.nextUrl.pathname;
  const metadata: RequestMetadata = {
    clientIP: null,
    isBot: false,
    ipAllowed: false,
    isAuthenticated: false,
    processingTimeMs: 0,
  };

  // ============================================================
  // Step 1: Extract client IP
  // ============================================================
  metadata.clientIP = extractClientIP(request.headers);

  // ============================================================
  // Step 2: Bot Detection
  // ============================================================
  const userAgent = request.headers.get("user-agent") ?? "";
  metadata.userAgent = userAgent;
  metadata.isBot = detectBot(userAgent);

  if (metadata.isBot && !isAllowedBot(pathname)) {
    metadata.processingTimeMs = Date.now() - startTime;
    return {
      passed: false,
      response: NextResponse.json(
        { error: "Forbidden", message: "Automated access not allowed" },
        { status: 403 }
      ),
      metadata,
    };
  }

  // ============================================================
  // Step 3: IP Filtering (for webhook endpoints)
  // ============================================================
  if (pathname.startsWith("/api/webhooks/") && metadata.clientIP) {
    const ipResult = filterIP(metadata.clientIP, {
      allowedCIDRs: WEBHOOK_IP_ALLOWLIST,
    });

    metadata.ipAllowed = ipResult.allowed;

    if (!ipResult.allowed) {
      metadata.processingTimeMs = Date.now() - startTime;
      return {
        passed: false,
        response: NextResponse.json(
          { error: "Forbidden", message: "Webhook source IP not allowed" },
          { status: 403 }
        ),
        metadata,
      };
    }
  } else {
    metadata.ipAllowed = true;
  }

  // ============================================================
  // Step 4: Rate Limiting
  // ============================================================
  if (metadata.clientIP) {
    const rateLimit = getRateLimitForPath(pathname);
    const rateLimitKey = `${pathname}:${metadata.clientIP}`;

    const rateLimitResult = await checkRateLimit(rateLimitKey);

    metadata.rateLimitKey = rateLimitKey;
    metadata.rateLimitRemaining = rateLimitResult.remaining;

    if (!rateLimitResult.allowed) {
      metadata.processingTimeMs = Date.now() - startTime;
      const response = NextResponse.json(
        {
          error: "Too Many Requests",
          message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter ?? 60}s.`,
        },
        { status: 429 }
      );
      response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
      response.headers.set("X-RateLimit-Remaining", "0");
      response.headers.set("Retry-After", (rateLimitResult.retryAfter ?? 60).toString());
      return {
        passed: false,
        response,
        metadata,
      };
    }
  }

  // ============================================================
  // Step 5: Device Fingerprinting
  // ============================================================
  const fingerprintInput = extractFingerprintFromHeaders(request.headers);
  const fingerprint = await generateDeviceFingerprint(fingerprintInput);
  metadata.deviceFingerprint = fingerprint.fingerprint;

  // ============================================================
  // Step 6: Authentication check (for non-public paths)
  // ============================================================
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p)
  );

  if (!isPublic) {
    const hasAuthHeader = request.headers.get("authorization")?.startsWith("Bearer ");
    const hasAPIKey = request.headers.get("x-api-key");
    const hasSessionCookie = request.cookies.get("sb-access-token")?.value;

    metadata.isAuthenticated = !!(hasAuthHeader || hasAPIKey || hasSessionCookie);

    // Note: We don't block here - let the endpoint handler do auth
    // This is for logging and metadata purposes
  } else {
    metadata.isAuthenticated = false;
  }

  // ============================================================
  // Complete
  // ============================================================
  metadata.processingTimeMs = Date.now() - startTime;

  return {
    passed: true,
    metadata,
  };
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Detect if request is from a known bot
 *
 * @param userAgent - The User-Agent header value
 * @returns True if user agent matches known bot patterns
 */
function detectBot(userAgent: string): boolean {
  if (!userAgent) return true; // Missing user agent = likely bot

  return BLOCKED_BOT_AGENTS.some((bot) =>
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );
}

/**
 * Check if a bot is allowed on certain paths (e.g., public pages)
 *
 * @param pathname - Request path
 * @returns True if bot access is allowed on this path
 */
function isAllowedBot(pathname: string): boolean {
  // Allow bots on public pages
  return (
    pathname === "/" ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/api/docs")
  );
}

/**
 * Get rate limit configuration for a path
 *
 * @param pathname - Request path
 * @returns Rate limit config (window in seconds, max requests)
 */
function getRateLimitForPath(pathname: string): { window: number; max: number } {
  // Check most specific patterns first
  if (pathname.startsWith("/api/webhooks/")) return RATE_LIMITS["/api/webhooks/"];
  if (pathname.startsWith("/api/auth/")) return RATE_LIMITS["/api/auth/"];
  if (pathname.startsWith("/api/payments")) return RATE_LIMITS["/api/payments"];
  if (pathname.startsWith("/api/transfers")) return RATE_LIMITS["/api/transfers"];
  if (pathname.startsWith("/api/cards")) return RATE_LIMITS["/api/cards"];

  return RATE_LIMITS["/api/"];
}

/**
 * Add security headers to response
 *
 * @param response - The response to modify
 * @returns Response with security headers
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  return response;
}
