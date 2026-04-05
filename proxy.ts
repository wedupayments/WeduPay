import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildTenantPath, extractTenantSlugFromHost, extractTenantSlugFromPathname, normalizeTenantSlug, stripTenantPrefix } from "@/lib/tenant";
import { extractClientIP, filterIP, isKnownProviderIP } from "@/lib/ip-filter";
import { generateDeviceFingerprint, extractFingerprintFromHeaders } from "@/lib/device-fingerprint";
import { checkRateLimit } from "@/lib/rate-limit";

// ============================================================
// Configuration
// ============================================================

const publicPaths = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/callback",
  "/api/auth/session",
  "/api/auth/create-user",
  "/api/waitlist",
  "/api/docs",
  "/api/docs.json",
  "/demo",
];
const isPublicPath = (path: string) =>
  publicPaths.some(p => path === p || path.startsWith(`${p}/`));

/**
 * Webhook IP allowlist - payment providers
 */
const WEBHOOK_IP_ALLOWLIST: string[] = [
  "196.216.0.0/14", // Safaricom (M-Pesa)
  "41.211.0.0/16",
  "3.223.0.0/16", // Flutterwave
  "52.206.0.0/16",
  "52.31.0.0/16", // Paystack
  "196.46.0.0/16", // EcoCash
];

/**
 * Blocked bot user agents
 */
const BLOCKED_BOT_AGENTS = [
  "Googlebot", "Bingbot", "Baiduspider", "YandexBot",
  "DuckDuckBot", "Slurp", "Sogou", "Exabot", "facebot",
  "ia_archiver", "AhrefsBot", "SemrushBot", "MJ12bot",
  "DotBot", "PetalBot", "Scrapy", "python-requests",
  "Go-http-client", "curl/", "wget/",
];

/**
 * Rate limit per endpoint pattern (window seconds, max requests)
 */
const RATE_LIMITS: Record<string, { window: number; max: number }> = {
  "/api/auth/": { window: 60, max: 10 },
  "/api/payments": { window: 60, max: 30 },
  "/api/transfers": { window: 60, max: 30 },
  "/api/cards": { window: 60, max: 20 },
  "/api/webhooks/": { window: 60, max: 100 },
  "/api/": { window: 60, max: 100 },
};

// ============================================================
// Security Pipeline
// ============================================================

function detectBot(userAgent: string): boolean {
  if (!userAgent) return true;
  return BLOCKED_BOT_AGENTS.some((bot) => userAgent.toLowerCase().includes(bot.toLowerCase()));
}

function isAllowedBot(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/terms") || pathname.startsWith("/privacy") || pathname.startsWith("/api/docs");
}

function getRateLimitForPath(pathname: string): { window: number; max: number } {
  if (pathname.startsWith("/api/webhooks/")) return RATE_LIMITS["/api/webhooks/"];
  if (pathname.startsWith("/api/auth/")) return RATE_LIMITS["/api/auth/"];
  if (pathname.startsWith("/api/payments")) return RATE_LIMITS["/api/payments"];
  if (pathname.startsWith("/api/transfers")) return RATE_LIMITS["/api/transfers"];
  if (pathname.startsWith("/api/cards")) return RATE_LIMITS["/api/cards"];
  return RATE_LIMITS["/api/"];
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  return response;
}

// ============================================================
// Middleware
// ============================================================

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const strippedPathname = stripTenantPrefix(pathname);
  const startTime = Date.now();

  // ============================================================
  // Security Step 1: Bot Detection
  // ============================================================
  const userAgent = request.headers.get("user-agent") ?? "";
  if (detectBot(userAgent) && !isAllowedBot(strippedPathname)) {
    return NextResponse.json(
      { error: "Forbidden", message: "Automated access not allowed" },
      { status: 403 }
    );
  }

  // ============================================================
  // Security Step 2: IP Filtering (webhook endpoints)
  // ============================================================
  const clientIP = extractClientIP(request.headers);
  if (strippedPathname.startsWith("/api/webhooks/") && clientIP) {
    const isAllowed = WEBHOOK_IP_ALLOWLIST.some((cidr) => {
      const parts = cidr.split("/");
      const [ip, prefixStr] = parts;
      const prefix = parseInt(prefixStr, 10);
      const ipParts = ip.split(".").map(Number);
      const ipNum = ((ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]) >>> 0;
      const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
      const start = ipNum & mask;
      const end = (start | ~mask) >>> 0;
      const checkParts = clientIP.split(".").map(Number);
      const checkNum = ((checkParts[0] << 24) | (checkParts[1] << 16) | (checkParts[2] << 8) | checkParts[3]) >>> 0;
      return checkNum >= start && checkNum <= end;
    });

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Forbidden", message: "Webhook source IP not allowed" },
        { status: 403 }
      );
    }
  }

  // ============================================================
  // Security Step 3: Rate Limiting
  // ============================================================
  if (clientIP) {
    const rateLimit = getRateLimitForPath(strippedPathname);
    const rateLimitKey = `${strippedPathname}:${clientIP}`;
    const rateLimitResult = await checkRateLimit(rateLimitKey);

    if (!rateLimitResult.allowed) {
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
      return response;
    }
  }

  // ============================================================
  // Security Step 4: Device Fingerprinting (header injection)
  // ============================================================
  const fingerprintInput = extractFingerprintFromHeaders(request.headers);
  const fingerprint = await generateDeviceFingerprint(fingerprintInput);

  // ============================================================
  // Tenant Resolution
  // ============================================================
  const tenantFromPath = extractTenantSlugFromPathname(pathname);
  const tenantFromHost = extractTenantSlugFromHost(request.nextUrl.hostname);
  const tenantFromQuery = normalizeTenantSlug(request.nextUrl.searchParams.get("tenant"));
  const tenantSlug = tenantFromPath || tenantFromHost || tenantFromQuery || request.cookies.get("wedupay-tenant")?.value || null;
  const isTenantPath = strippedPathname !== pathname;

  const applyTenantCookie = (response: NextResponse) => {
    if (tenantSlug) {
      response.cookies.set("wedupay-tenant", tenantSlug, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return response;
  };

  // Tenant path rewrites
  if (isTenantPath) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = strippedPathname;
    if (tenantSlug && !rewriteUrl.searchParams.get("tenant")) {
      rewriteUrl.searchParams.set("tenant", tenantSlug);
    }

    if (isPublicPath(strippedPathname)) {
      return applyTenantCookie(NextResponse.rewrite(rewriteUrl));
    }
  }

  // ============================================================
  // Authentication Check
  // ============================================================
  const accessToken = request.cookies.get("sb-access-token")?.value;
  const refreshToken = request.cookies.get("sb-refresh-token")?.value;
  const bearerToken = request.headers.get("authorization");
  const apiKey = request.headers.get("x-api-key");

  if (isPublicPath(strippedPathname)) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return applyTenantCookie(response);
  }

  if (!accessToken && !refreshToken && !bearerToken?.startsWith("Bearer ") && !apiKey) {
    if (strippedPathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const redirectTarget = tenantSlug ? buildTenantPath(strippedPathname, tenantSlug) : strippedPathname;
    const loginUrl = new URL(tenantSlug ? buildTenantPath("/auth/login", tenantSlug) : "/auth/login", request.url);
    loginUrl.searchParams.set("redirect", redirectTarget);
    if (tenantSlug) {
      loginUrl.searchParams.set("tenant", tenantSlug);
    }
    return applyTenantCookie(NextResponse.redirect(loginUrl));
  }

  if (isTenantPath) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = strippedPathname;
    if (tenantSlug && !rewriteUrl.searchParams.get("tenant")) {
      rewriteUrl.searchParams.set("tenant", tenantSlug);
    }
    const response = NextResponse.rewrite(rewriteUrl);
    addSecurityHeaders(response);
    return applyTenantCookie(response);
  }

  const response = NextResponse.next();
  addSecurityHeaders(response);
  return applyTenantCookie(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|icons).*)",
  ],
};
