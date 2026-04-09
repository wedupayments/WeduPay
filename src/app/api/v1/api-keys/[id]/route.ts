import { NextRequest } from "next/server";
import { apiKeyController } from "@/controllers/api-key.controller";
import { authenticateRequest, requireAuth, requireAppUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) return authError;
  const profileError = requireAppUser(auth);
  if (profileError) return profileError;

  const { id } = await params;
  return apiKeyController.get(request, id, auth.userId!);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) return authError;
  const profileError = requireAppUser(auth);
  if (profileError) return profileError;

  const { id } = await params;
  return apiKeyController.update(request, id, auth.userId!);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) return authError;
  const profileError = requireAppUser(auth);
  if (profileError) return profileError;

  const { id } = await params;
  return apiKeyController.delete(request, id, auth.userId!);
}
