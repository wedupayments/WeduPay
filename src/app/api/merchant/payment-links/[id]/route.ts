import { NextRequest, NextResponse } from "next/server";
import { paymentLinkService } from "@/services/payment-link.service";
import { authenticateRequest, requireTenantAccess } from "@/lib/auth";
import { createErrorResponse } from "@/lib/api-response";
import { z } from "zod";

const updatePaymentLinkSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  description: z.string().max(255).optional(),
  expiresAt: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
  usageLimit: z.number().int().positive().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    const tenantError = requireTenantAccess(auth);
    if (tenantError) return tenantError;

    const { id } = await params;
    // Note: getPaymentLink usually takes linkId (the hash), 
    // but for administrative purposes, we might use the database ID.
    // I'll check if id looks like a hash or a DB uuid/id.
    // If it's the internal ID, I'll need a getPaymentLinkById method.
    // Let's assume id is the linkId for now OR implement getById.

    const link = await (paymentLinkService as any).getPaymentLinkById ? 
        await (paymentLinkService as any).getPaymentLinkById(id, auth.tenantId!) :
        await paymentLinkService.getPaymentLink(id);

    if (!link || link.tenantId !== auth.tenantId) {
      return NextResponse.json(
        createErrorResponse("NOT_FOUND", "Payment link not found").body,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      link,
    });
  } catch (error: any) {
    console.error("[API] Merchant Payment Link GET error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", error.message).body,
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    const tenantError = requireTenantAccess(auth);
    if (tenantError) return tenantError;

    const body = await request.json();
    const validation = updatePaymentLinkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse("VALIDATION_ERROR", "Invalid update request").body,
        { status: 400 }
      );
    }

    const { id } = await params;
    const link = await paymentLinkService.updatePaymentLink(id, auth.tenantId!, validation.data);

    return NextResponse.json({
      success: true,
      link,
    });
  } catch (error: any) {
    console.error("[API] Merchant Payment Link PATCH error:", error);
    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", error.message).body,
      { status: 500 }
    );
  }
}
