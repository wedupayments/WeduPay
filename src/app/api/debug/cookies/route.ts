import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Debug endpoint to check cookie status
 * Only available in development or with debug flag
 */
export async function GET(request: NextRequest) {
  // Only allow in development or with debug header
  const debugHeader = request.headers.get("x-debug-key");
  const isDev = process.env.NODE_ENV === "development";
  
  if (!isDev && debugHeader !== process.env.DEBUG_KEY) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  const accessToken = cookieStore.get("sb-access-token");
  const refreshToken = cookieStore.get("sb-refresh-token");
  
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    url: request.url,
    headers: {
      host: request.headers.get("host"),
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
      userAgent: request.headers.get("user-agent"),
    },
    cookies: {
      accessToken: accessToken ? {
        name: accessToken.name,
        value: accessToken.value.substring(0, 20) + "...",
        hasValue: !!accessToken.value,
      } : null,
      refreshToken: refreshToken ? {
        name: refreshToken.name,
        hasValue: !!refreshToken.value,
      } : null,
      allCookieNames: allCookies.map(c => c.name),
      totalCookies: allCookies.length,
    },
  });
}
