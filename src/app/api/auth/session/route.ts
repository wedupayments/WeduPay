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
  
  response.cookies.set("sb-access-token", "", clearOptions);
  response.cookies.set("sb-refresh-token", "", clearOptions);
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

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearLegacyCookies(response);
  return response;
}
