import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { authenticateRequest, requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId! },
      select: {
        id: true,
        email: true,
        country: true,
        kycStatus: true,
        supabaseUserId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    let submission: Record<string, unknown> | null = null;

    if (user.supabaseUserId) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(user.supabaseUserId);
      submission = (data.user?.user_metadata?.kycSubmission ?? null) as Record<string, unknown> | null;
    }

    return NextResponse.json({
      success: true,
      kyc: {
        status: user.kycStatus,
        country: user.country,
        submission,
      },
    });
  } catch (error) {
    console.error("KYC status error:", error);
    return NextResponse.json({ success: false, error: "Failed to load KYC status" }, { status: 500 });
  }
}
