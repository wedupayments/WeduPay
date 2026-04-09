import { NextRequest } from "next/server";
import { settlementController } from "@/controllers/settlement.controller";
import { authenticateRequest, requireTenantAccess } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  const tenantError = requireTenantAccess(auth);
  if (tenantError) return tenantError;

  const { id } = await params;
  return settlementController.getSettlement(request, id, auth.tenantId!);
}
