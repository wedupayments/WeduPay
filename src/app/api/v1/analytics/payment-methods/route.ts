import { NextRequest } from "next/server";
import { analyticsController } from "@/controllers/analytics.controller";
import { authenticateRequest, requireTenantAccess } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  const tenantError = requireTenantAccess(auth);
  if (tenantError) return tenantError;

  return analyticsController.getPaymentMethods(request, auth.tenantId!);
}
