import { NextResponse, NextRequest } from "next/server";
import { ledgerService } from "@/services";
import { authenticateRequest, requirePermission } from "@/lib/auth";
import { ledgerCreateSchema, validateRequest } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request as unknown as Request);
  const authError = requirePermission(auth, "payments:manage");
  if (authError) return authError;
  try {
    const body = await request.json();
    const validation = validateRequest(ledgerCreateSchema, body);

    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: "VALIDATION_ERROR", details: validation.errors }, { status: 400 });
    }

    const { transactionId, debits, credits } = validation.data;

    // validation ensures defaults for `currency`, but narrow types at runtime
    await ledgerService.createDoubleEntry(transactionId, debits as any, credits as any);

    return NextResponse.json({ success: true, message: "Ledger entries created" }, { status: 201 });
  } catch (error) {
    console.error("Ledger entries create error:", error);
    return NextResponse.json({ error: "Failed to create ledger entries" }, { status: 500 });
  }
}
