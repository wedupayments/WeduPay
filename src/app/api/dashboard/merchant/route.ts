import { NextResponse } from "next/server";
import { authenticateRequest, requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }

    // Mock merchant dashboard data
    const dashboardData = {
      user: {
        name: auth.email?.split("@")[0] || "Merchant",
        email: auth.email,
      },
      stats: {
        totalRevenue: "$24,890.00",
        todayRevenue: "$1,250.00",
        completedPayments: 234,
        pendingPayments: 12,
        successRate: "98.5%",
        activeLinks: 8,
      },
      recentPayments: [
        {
          id: "1",
          reference: "PAY-2024-001",
          customer: "John Doe",
          amount: "$125.00",
          status: "Verified",
          date: "2024-01-15 10:30 AM",
        },
        {
          id: "2",
          reference: "PAY-2024-002",
          customer: "Jane Smith",
          amount: "$89.50",
          status: "Pending",
          date: "2024-01-15 09:15 AM",
        },
        {
          id: "3",
          reference: "PAY-2024-003",
          customer: "Bob Johnson",
          amount: "$250.00",
          status: "Verified",
          date: "2024-01-14 04:20 PM",
        },
      ],
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Merchant dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchant dashboard data" },
      { status: 500 }
    );
  }
}
