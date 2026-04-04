import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildTenantPath, extractTenantSlugFromHost, extractTenantSlugFromPathname, normalizeTenantSlug, stripTenantPrefix } from "@/lib/tenant";

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
  "/demo",
];
const isPublicPath = (path: string) => 
  publicPaths.some(p => path === p || path.startsWith(`${p}/`));

export function middleware(request: NextRequest) {
  const tenantFromPath = extractTenantSlugFromPathname(request.nextUrl.pathname);
  const tenantFromHost = extractTenantSlugFromHost(request.nextUrl.hostname);
  const tenantFromQuery = normalizeTenantSlug(request.nextUrl.searchParams.get("tenant"));
  const tenantSlug = tenantFromPath || tenantFromHost || tenantFromQuery || request.cookies.get("wedupay-tenant")?.value || null;
  const strippedPathname = stripTenantPrefix(request.nextUrl.pathname);
  const isTenantPath = strippedPathname !== request.nextUrl.pathname;

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

  const accessToken = request.cookies.get("sb-access-token")?.value;
  const refreshToken = request.cookies.get("sb-refresh-token")?.value;
  const bearerToken = request.headers.get("authorization");
  const apiKey = request.headers.get("x-api-key");

  if (isPublicPath(strippedPathname)) {
    return applyTenantCookie(NextResponse.next());
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
    return applyTenantCookie(NextResponse.rewrite(rewriteUrl));
  }

  return applyTenantCookie(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|icons).*)",
  ],
};
