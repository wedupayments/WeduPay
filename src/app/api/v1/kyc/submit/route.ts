import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { authenticateRequest, requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const submitKycSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  documentType: z.enum(["PASSPORT", "NATIONAL_ID", "DRIVERS_LICENSE"]),
  documentNumber: z.string().min(5, "Document number is required"),
  country: z.string().length(2, "Country code must be 2 letters"),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }

    const body = await request.json();
    const validation = submitKycSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid KYC submission", details: validation.error.errors },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId! },
      select: { supabaseUserId: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: auth.userId! },
      data: {
        country: validation.data.country,
        kycStatus: "pending",
      },
    });

    if (user.supabaseUserId) {
      await supabaseAdmin.auth.admin.updateUserById(user.supabaseUserId, {
        user_metadata: {
          kycSubmission: {
            ...validation.data,
            submittedAt: new Date().toISOString(),
            provider: "didit_pending_integration",
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "KYC details submitted successfully",
    });
  } catch (error) {
    console.error("KYC submit error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit KYC details" }, { status: 500 });
  }
}
