import { NextResponse } from "next/server";
import { PaymentController } from "@/controllers";
import { getSecurityHeaders } from "@/lib/api-middleware";
import { getCacheHeaders } from "@/lib/api-response";
import { cookies } from "next/headers";

const paymentController = new PaymentController();

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("wedupay-user-id")?.value;

  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const response = await paymentController.listPayments(request);
  return response;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("wedupay-user-id")?.value;

  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const response = await paymentController.createPayment(request);
  
  return NextResponse.json(response.body, {
    status: response.status,
    headers: {
      ...getCacheHeaders(false),
      ...getSecurityHeaders(),
      ...(response.status === 201 ? { Location: `/api/v1/payments` } : {}),
    },
  });
}
