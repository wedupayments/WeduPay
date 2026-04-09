import { NextRequest, NextResponse } from "next/server";
import { webhookService } from "@/services/webhook.service";
import { authenticateRequest, requireTenantAccess, requireAppUser } from "@/lib/auth";
import { createErrorResponse } from "@/lib/api-response";
import { z } from "zod";

const createEndpointSchema = z.object({
  url: z.string().url(),
  description: z.string().max(255).optional(),
  events: z.array(z.string()).min(1),
  isActive: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    const tenantError = requireTenantAccess(auth);
    if (tenantError) return tenantError;
    const userError = requireAppUser(auth);
    if (userError) return userError;

    const body = await request.json();
    const validation = createEndpointSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse("VALIDATION_ERROR", "Invalid webhook endpoint data").body,
        { status: 400 }
      );
    }

    const { url, description, events } = validation.data;
    const endpoint = await webhookService.createEndpoint(
      auth.tenantId!,
      auth.userId!,
      url,
      description,
      events
    );

    return NextResponse.json({
      success: true,
      endpoint,
    });
  } catch (error: any) {
    console.error("[API] Webhook Endpoint POST error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", error.message).body,
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    const tenantError = requireTenantAccess(auth);
    if (tenantError) return tenantError;

    const endpoints = await webhookService.listEndpoints(auth.tenantId!);

    return NextResponse.json({
      success: true,
      endpoints,
    });
  } catch (error: any) {
    console.error("[API] Webhook Endpoints GET error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", error.message).body,
      { status: 500 }
    );
  }
}
