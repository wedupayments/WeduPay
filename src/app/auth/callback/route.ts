import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Get cookie options based on environment
function getCookieOptions(maxAge: number) {
  const isProduction = process.env.NODE_ENV === "production";
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tenantSlug = requestUrl.searchParams.get("tenant");

  console.log('[Auth Callback] Processing callback, code present:', !!code);

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      console.log('[Auth Callback] Session exchanged successfully');
      
      // Build redirect path preserving tenant context
      const basePath = "/dashboard";
      const redirectPath = tenantSlug ? `/t/${tenantSlug}${basePath}` : basePath;
      const redirectUrl = new URL(redirectPath, requestUrl.origin);

      if (tenantSlug) {
        redirectUrl.searchParams.set("tenant", tenantSlug);
      }

      const response = NextResponse.redirect(redirectUrl);

      // Set cookies with proper options
      response.cookies.set("sb-access-token", data.session.access_token, getCookieOptions(60 * 60 * 24 * 7));
      response.cookies.set("sb-refresh-token", data.session.refresh_token, getCookieOptions(60 * 60 * 24 * 7));

      // Persist tenant context in cookie if provided
      if (tenantSlug) {
        response.cookies.set("wedupay-tenant", tenantSlug, getCookieOptions(60 * 60 * 24 * 30));
      }

      return response;
    } else {
      console.error('[Auth Callback] Error exchanging code:', error);
    }
  }

  // Preserve tenant context on error redirect too
  const errorPath = "/auth/login?error=auth_callback_failed";
  const errorUrl = tenantSlug
    ? `/t/${tenantSlug}${errorPath}&tenant=${tenantSlug}`
    : errorPath;

  return NextResponse.redirect(new URL(errorUrl, requestUrl.origin));
}
