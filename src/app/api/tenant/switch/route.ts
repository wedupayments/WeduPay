import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/supabase-server";

const switchSchema = z.object({
  tenantSlug: z.string().min(1, "Tenant slug is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = switchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    const { tenantSlug } = validation.data;

    // Verify user is authenticated
    const token = request.cookies.get("sb-access-token")?.value;
    const user = token ? await getSession(token) : null;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Verify user has membership in this tenant
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ supabaseUserId: user.id }, { email: user.email?.trim().toLowerCase() }],
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      );
    }

    const membership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: dbUser.id,
        },
      },
    });

    if (!membership || membership.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "No access to this tenant" },
        { status: 403 }
      );
    }

    // Set tenant cookie
    const response = NextResponse.json({
      success: true,
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
    });

    response.cookies.set("wedupay-tenant", tenantSlug, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to switch tenant",
      },
      { status: 500 }
    );
  }
}
