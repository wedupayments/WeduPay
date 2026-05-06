import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailTemplates } from "@/lib/email-templates";

// Admin email address - configure in environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

export async function POST(request: Request) {
  try {
    const { email, type, name } = await request.json();

    if (!email || !type) {
      return NextResponse.json(
        { error: "Email and type are required" },
        { status: 400 }
      );
    }

    // Create waitlist entry
    const entry = await prisma.waitlist.create({
      data: {
        email,
        type,
        name,
      },
    });

    // Get total waitlist count for notification
    const totalWaitlist = await prisma.waitlist.count();

    // Email templates for confirmation and notification
    // In production, use these templates to send emails via Resend/SendGrid
    emailTemplates.waitlistConfirmation({
      type: type === "MERCHANT" ? "Merchant" : "Customer",
      position: totalWaitlist,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
      helpUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/help`,
    });

    emailTemplates.waitlistNotification({
      email,
      type: type === "MERCHANT" ? "Merchant" : "Customer",
      name: name || "Not provided",
      totalWaitlist,
      adminUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/admin`,
      helpUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/help`,
    });

    console.log("📧 Email templates generated for:", email, "(admin:", ADMIN_EMAIL + ")");

    return NextResponse.json({ 
      success: true, 
      entry,
      position: totalWaitlist,
      message: "You've been added to the waitlist!"
    });
  } catch (error: unknown) {
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
