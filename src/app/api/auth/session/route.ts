import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/supabase-server";

const sessionSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  refreshToken: z.string().min(1).optional(),
  expiresAt: z.number().int().positive().optional(),
});

function clearLegacyCookies(response: NextResponse) {
  response.cookies.set("sb-access-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  response.cookies.set("sb-refresh-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  response.cookies.set("wedupay-user-id", "", { path: "/", maxAge: 0, sameSite: "lax" });
  response.cookies.set("wedupay-user-email", "", { path: "/", maxAge: 0, sameSite: "lax" });
  response.cookies.set("wedupay-user-role", "", { path: "/", maxAge: 0, sameSite: "lax" });
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
    const user = await getSession(accessToken);

    if (!user) {
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

    response.cookies.set("sb-access-token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: accessMaxAge,
      path: "/",
    });

    if (refreshToken) {
      response.cookies.set("sb-refresh-token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    clearLegacyCookies(response);
    return response;
  } catch (error) {
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
