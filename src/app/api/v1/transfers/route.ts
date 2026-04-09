import { NextRequest } from "next/server";
import { transferController } from "@/controllers/transfer.controller";
import { authenticateRequest, requireAuth, requireAppUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) return authError;
  const profileError = requireAppUser(auth);
  if (profileError) return profileError;

  return transferController.list(request, auth.userId!);
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) return authError;
  const profileError = requireAppUser(auth);
  if (profileError) return profileError;

  return transferController.create(request, auth.userId!);
}
