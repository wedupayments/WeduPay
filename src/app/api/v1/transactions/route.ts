import { NextRequest } from "next/server";
import { transactionController } from "@/controllers/transaction.controller";
import { authenticateRequest, requireAuth, requireAppUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) return authError;
  const profileError = requireAppUser(auth);
  if (profileError) return profileError;

  return transactionController.list(request, auth.userId!);
}
