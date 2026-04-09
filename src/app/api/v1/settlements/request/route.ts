import { NextRequest } from "next/server";
import { settlementController } from "@/controllers/settlement.controller";
import { authenticateRequest, requireTenantAccess, requireAppUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  const tenantError = requireTenantAccess(auth);
  if (tenantError) return tenantError;
  const userError = requireAppUser(auth);
  if (userError) return userError;

  return settlementController.requestSettlement(request, auth.tenantId!, auth.userId!);
}
