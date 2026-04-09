import { NextRequest } from "next/server";
import { apiKeyController } from "@/controllers/api-key.controller";
import { authenticateRequest, requireAuth, requireAppUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) return authError;
  const profileError = requireAppUser(auth);
  if (profileError) return profileError;

  return apiKeyController.list(request, auth.userId!);
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) return authError;
  const profileError = requireAppUser(auth);
  if (profileError) return profileError;

  return apiKeyController.create(request, auth.userId!);
}
