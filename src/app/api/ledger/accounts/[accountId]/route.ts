import { NextResponse, NextRequest } from "next/server";
import { ledgerService } from "@/services";
import { authenticateRequest, requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest, context: any) {
  const { params } = context;
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) return authError;

  try {
    const { accountId } = params;
    const url = new URL(request.url);
    const currency = (url.searchParams.get("currency") || "USD").toUpperCase();

    const statement = await ledgerService.getAccountStatement(accountId, currency);

    return NextResponse.json({ data: statement }, { status: 200 });
  } catch (error) {
    console.error("Get account statement error:", error);
    return NextResponse.json({ error: "Failed to fetch account statement" }, { status: 500 });
  }
}
