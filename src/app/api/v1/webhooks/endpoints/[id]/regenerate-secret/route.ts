import { NextRequest, NextResponse } from "next/server";
import { webhookController } from "@/controllers/webhook.controller";
import { authenticateRequest } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  return webhookController.regenerateSecret(request, id, auth.tenantId!);
}
