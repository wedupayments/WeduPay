import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("sb-access-token")?.value;
    const user = token ? await getSession(token) : null;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    const memberships = await prisma.tenantMembership.findMany({
      where: {
        userId: dbUser.id,
        status: "ACTIVE",
      },
      include: {
        tenant: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "asc" },
      ],
    });

    const result = memberships.map((m) => ({
      tenantId: m.tenant.id,
      tenantSlug: m.tenant.slug,
      tenantName: m.tenant.name,
      role: m.role,
      isDefault: m.isDefault,
    }));

    return NextResponse.json({
      success: true,
      memberships: result,
      userId: dbUser.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch memberships",
      },
      { status: 500 }
    );
  }
}
