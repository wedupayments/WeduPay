import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/supabase-server";

const sessionSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  refreshToken: z.string().min(1).optional(),
  expiresAt: z.number().int().positive().optional(),
});

// Get cookie options based on environment
function getCookieOptions(maxAge: number) {
  const isProduction = process.env.NODE_ENV === "production";
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    maxAge,
    path: "/",
    // In production, don't set domain to allow cookies to work on Vercel subdomains
  };
}

function clearLegacyCookies(response: NextResponse) {
  const clearOptions = getCookieOptions(0);
  
  // Only clear actual legacy cookies, do NOT clear sb-access-token or sb-refresh-token here
  response.cookies.set("wedupay-user-id", "", clearOptions);
  response.cookies.set("wedupay-user-email", "", clearOptions);
  response.cookies.set("wedupay-user-role", "", clearOptions);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = sessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid session payload",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { accessToken, refreshToken, expiresAt } = validation.data;
    
    console.log('[Session API] Setting session cookies for production:', process.env.NODE_ENV === "production");
    
    const user = await getSession(accessToken);

    if (!user) {
      console.log('[Session API] Invalid access token');
      return NextResponse.json(
        {
          success: false,
          error: "Invalid access token",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email ?? null,
      },
      session: {
        userId: user.id,
        email: user.email ?? null,
        expiresAt: expiresAt ? expiresAt * 1000 : Date.now() + 60 * 60 * 1000,
      }
    });

    const accessMaxAge = expiresAt
      ? Math.max(60, expiresAt - Math.floor(Date.now() / 1000))
      : 60 * 60;

    console.log('[Session API] Setting access token cookie with maxAge:', accessMaxAge);
    response.cookies.set("sb-access-token", accessToken, getCookieOptions(accessMaxAge));

    if (refreshToken) {
      console.log('[Session API] Setting refresh token cookie');
      response.cookies.set("sb-refresh-token", refreshToken, getCookieOptions(60 * 60 * 24 * 30));
    }

    clearLegacyCookies(response);
    return response;
  } catch (error) {
    console.error('[Session API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to persist session",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("sb-access-token")?.value;
    const refreshToken = request.cookies.get("sb-refresh-token")?.value;

    if (!accessToken && !refreshToken) {
      return NextResponse.json({ success: false, session: null }, { status: 200 });
    }

    // Try the access token first
    if (accessToken) {
      const user = await getSession(accessToken);
      if (user) {
        return NextResponse.json({
          success: true,
          user: { id: user.id, email: user.email ?? null },
          session: {
            userId: user.id,
            email: user.email ?? null,
            expiresAt: Date.now() + 60 * 60 * 1000,
          }
        });
      }
    }

    // Access token missing or expired — try refreshing with the refresh token
    if (refreshToken) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        // Call Supabase token endpoint directly — works even when access token is expired/absent
        const tokenResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseAnonKey,
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();

          if (tokenData.access_token && tokenData.user) {
            const accessMaxAge = tokenData.expires_in ?? 3600;
            const expiresAt = Date.now() + accessMaxAge * 1000;

            const response = NextResponse.json({
              success: true,
              user: { id: tokenData.user.id, email: tokenData.user.email ?? null },
              session: {
                userId: tokenData.user.id,
                email: tokenData.user.email ?? null,
                expiresAt,
              }
            });

            response.cookies.set("sb-access-token", tokenData.access_token, getCookieOptions(accessMaxAge));
            if (tokenData.refresh_token) {
              response.cookies.set("sb-refresh-token", tokenData.refresh_token, getCookieOptions(60 * 60 * 24 * 30));
            }
            return response;
          }
        }
      } catch (refreshErr) {
        console.error('[Session API] Token refresh failed:', refreshErr);
      }
    }

    // Both tokens invalid — clear cookies
    const response = NextResponse.json({ success: false, session: null }, { status: 200 });
    response.cookies.set("sb-access-token", "", getCookieOptions(0));
    response.cookies.set("sb-refresh-token", "", getCookieOptions(0));
    clearLegacyCookies(response);
    return response;
  } catch (error) {
    console.error('[Session API] GET Error:', error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  const clearOptions = getCookieOptions(0);
  
  response.cookies.set("sb-access-token", "", clearOptions);
  response.cookies.set("sb-refresh-token", "", clearOptions);
  
  clearLegacyCookies(response);
  return response;
}
