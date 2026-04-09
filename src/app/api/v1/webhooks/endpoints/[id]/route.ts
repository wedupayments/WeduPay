import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { webhookService } from "@/services/webhook.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const endpoint = await webhookService.getEndpoint(id);

    if (!endpoint || endpoint.tenantId !== auth.tenantId) {
      return NextResponse.json({ success: false, error: "Endpoint not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, endpoint });
  } catch (err) {
    console.error("Webhook endpoint detail API error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const endpoint = await webhookService.updateEndpoint(id, auth.tenantId!, body);

    return NextResponse.json({ success: true, endpoint });
  } catch (err) {
    console.error("Webhook endpoint update API error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await webhookService.deleteEndpoint(id, auth.tenantId!);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Webhook endpoint delete API error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
