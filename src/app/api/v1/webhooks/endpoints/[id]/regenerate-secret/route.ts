import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { webhookService } from "@/services/webhook.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const endpoint = await webhookService.regenerateSecret(id, auth.tenantId!);

    return NextResponse.json({ success: true, secret: endpoint.secretKey });
  } catch (err) {
    console.error("Webhook secret regeneration API error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
