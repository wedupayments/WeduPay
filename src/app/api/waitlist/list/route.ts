import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const waitlist = await prisma.waitlist.findMany({
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.waitlist.count();
    const merchants = await prisma.waitlist.count({ where: { type: "MERCHANT" } });
    const students = await prisma.waitlist.count({ where: { type: "STUDENT" } });

    return NextResponse.json({
      waitlist,
      stats: {
        total,
        merchants,
        students,
      },
    });
  } catch (error: unknown) {
    console.error("Failed to fetch waitlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}
