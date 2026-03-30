import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const references = await prisma.paymentReference.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ references });
  } catch (error: unknown) {
    console.error("Failed to fetch payment references:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment references" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { title, institution, referenceCode, userId } = await request.json();

    if (!title || !institution || !userId) {
      return NextResponse.json(
        { error: "Title, institution, and userId are required" },
        { status: 400 }
      );
    }

    const reference = await prisma.paymentReference.create({
      data: {
        title,
        institution,
        referenceCode: referenceCode || `REF-${Date.now()}`,
        userId,
      },
    });

    return NextResponse.json({ success: true, reference });
  } catch (error: unknown) {
    console.error("Failed to create payment reference:", error);
    return NextResponse.json(
      { error: "Failed to create payment reference" },
      { status: 500 }
    );
  }
}
