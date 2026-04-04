import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tenantSlug = requestUrl.searchParams.get("tenant");

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Build redirect path preserving tenant context
      const basePath = "/dashboard";
      const redirectPath = tenantSlug ? `/t/${tenantSlug}${basePath}` : basePath;
      const redirectUrl = new URL(redirectPath, requestUrl.origin);

      if (tenantSlug) {
        redirectUrl.searchParams.set("tenant", tenantSlug);
      }

      const response = NextResponse.redirect(redirectUrl);

      response.cookies.set("sb-access-token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      response.cookies.set("sb-refresh-token", data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      // Persist tenant context in cookie if provided
      if (tenantSlug) {
        response.cookies.set("wedupay-tenant", tenantSlug, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });
      }

      return response;
    }
  }

  // Preserve tenant context on error redirect too
  const errorPath = "/auth/login?error=auth_callback_failed";
  const errorUrl = tenantSlug
    ? `/t/${tenantSlug}${errorPath}&tenant=${tenantSlug}`
    : errorPath;

  return NextResponse.redirect(new URL(errorUrl, requestUrl.origin));
}
