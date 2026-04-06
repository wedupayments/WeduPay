import { NextResponse } from "next/server";
import { authenticateRequest, requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }

    // Mock payments data
    const payments = [
      {
        id: "1",
        reference: "PAY-2024-001",
        customer: "John Doe",
        amount: "$125.00",
        currency: "USD",
        status: "Verified",
        date: "2024-01-15 10:30 AM",
        method: "Mobile Money",
      },
      {
        id: "2",
        reference: "PAY-2024-002",
        customer: "Jane Smith",
        amount: "$89.50",
        currency: "USD",
        status: "Pending",
        date: "2024-01-15 09:15 AM",
        method: "Card",
      },
      {
        id: "3",
        reference: "PAY-2024-003",
        customer: "Bob Johnson",
        amount: "$250.00",
        currency: "USD",
        status: "Verified",
        date: "2024-01-14 04:20 PM",
        method: "Bank Transfer",
      },
      {
        id: "4",
        reference: "PAY-2024-004",
        customer: "Alice Williams",
        amount: "$45.00",
        currency: "USD",
        status: "Processing",
        date: "2024-01-14 02:10 PM",
        method: "Mobile Money",
      },
      {
        id: "5",
        reference: "PAY-2024-005",
        customer: "Charlie Brown",
        amount: "$180.00",
        currency: "USD",
        status: "Failed",
        date: "2024-01-13 11:45 AM",
        method: "Card",
      },
    ];

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Merchant payments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
