import { NextResponse } from "next/server";
import { PaymentController } from "@/controllers";
import { getSecurityHeaders } from "@/lib/api-middleware";
import { getCacheHeaders } from "@/lib/api-response";
import { authenticateRequest, requireAuth, requireAppUser } from "@/lib/auth";

const paymentController = new PaymentController();

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) {
    return authError;
  }
  const profileError = requireAppUser(auth);
  if (profileError) {
    return profileError;
  }

  const response = await paymentController.listPayments(request, auth.userId!);
  return response;
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  const authError = requireAuth(auth);
  if (authError) {
    return authError;
  }
  const profileError = requireAppUser(auth);
  if (profileError) {
    return profileError;
  }

  const response = await paymentController.createPayment(request, auth.userId!);
  
  return NextResponse.json(response.body, {
    status: response.status,
    headers: {
      ...getCacheHeaders(false),
      ...getSecurityHeaders(),
      ...(response.status === 201 ? { Location: `/api/v1/payments` } : {}),
    },
  });
}
