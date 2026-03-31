import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createErrorResponse } from "@/lib/api-response";

function buildResourceUrl(request: Request, id?: string): string {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}/api/v1/payments`;
  return id ? `${baseUrl}/${id}` : baseUrl;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("wedupay-user-id")?.value;

    if (!userId) {
      const error = createErrorResponse("UNAUTHORIZED", "Authentication required", undefined, 401);
      return NextResponse.json(error.body, { status: error.status });
    }

    const { id } = await params;

    const payment = await prisma.transaction.findFirst({
      where: { id, userId, type: "PAYMENT" },
    });

    if (!payment) {
      const error = createErrorResponse("NOT_FOUND", "Payment not found", undefined, 404);
      return NextResponse.json(error.body, { status: error.status });
    }

    const response = {
      data: {
        id: payment.id,
        type: "payment",
        attributes: {
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          reference: payment.reference,
          type: payment.type,
          createdAt: payment.createdAt,
        },
      },
      links: {
        self: buildResourceUrl(request, payment.id),
        collection: buildResourceUrl(request),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch payment:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to fetch payment", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}
