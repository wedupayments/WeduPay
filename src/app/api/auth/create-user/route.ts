import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, userId } = await request.json();

    if (!email || !userId) {
      return NextResponse.json(
        { error: "Email and userId are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        phoneNumber: "",
        country: "",
        kycStatus: "PENDING",
        supabaseUserId: userId,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: unknown) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user profile" },
      { status: 500 }
    );
  }
}
