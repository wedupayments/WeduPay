import { NextRequest } from "next/server";
import { webhookController } from "@/controllers/webhook.controller";
import { authenticateRequest, requireTenantAccess, requireAppUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  const tenantError = requireTenantAccess(auth);
  if (tenantError) return tenantError;

  return webhookController.listEndpoints(request, auth.tenantId!);
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  const tenantError = requireTenantAccess(auth);
  if (tenantError) return tenantError;
  const userError = requireAppUser(auth);
  if (userError) return userError;

  return webhookController.createEndpoint(request, auth.tenantId!, auth.userId!);
}
