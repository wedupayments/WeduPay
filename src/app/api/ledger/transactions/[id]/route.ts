import { NextResponse, NextRequest } from "next/server";
import { ledgerService } from "@/services";
import { authenticateRequest, requirePermission } from "@/lib/auth";

export async function GET(request: NextRequest, context: any) {
  const { params } = context;
  const auth = await authenticateRequest(request);
  const authError = requirePermission(auth, "payments:manage");
  if (authError) return authError;
  try {
    const { id } = params;
    const entries = await ledgerService.getTransactionLedger(id);

    if (!entries || entries.length === 0) {
      return NextResponse.json({ data: [], message: "No ledger entries found" }, { status: 200 });
    }

    const verification = await ledgerService.verifyDoubleEntry(id);

    return NextResponse.json({ data: entries, verification }, { status: 200 });
  } catch (error) {
    console.error("Get transaction ledger error:", error);
    return NextResponse.json({ error: "Failed to fetch ledger entries" }, { status: 500 });
  }
}
