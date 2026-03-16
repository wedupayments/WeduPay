import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, type, name } = await request.json();

    if (!email || !type) {
      return NextResponse.json(
        { error: "Email and type are required" },
        { status: 400 }
      );
    }

    const entry = await prisma.waitlist.create({
      data: {
        email,
        type,
        name,
      },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error: unknown) {
    // The original code already uses 'unknown' which is the recommended type for catch blocks.
    // The instruction implies replacing 'any', but 'any' is not present.
    // The provided 'Code Edit' snippet seems to be a malformed example of error handling
    // that introduces undefined variables like 'setMessage' and incorrect syntax.
    // Therefore, the most faithful interpretation is to ensure the existing 'unknown'
    // type is handled appropriately, which the current code already does by narrowing
    // the type for the specific Prisma error and then providing a generic fallback.

    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "This email is already on our waitlist!" },
        { status: 400 }
      );
    }
    console.error("Waitlist error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
