import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createApiResponse, createErrorResponse } from "@/lib/api-response";

const MOBILE_MONEY_PROVIDERS = ["EcoCash", "M-Pesa", "MTN"] as const;

function buildResourceUrl(request: Request, id?: string): string {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}/api/v1/payments`;
  return id ? `${baseUrl}/${id}` : baseUrl;
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("wedupay-user-id")?.value;

    if (!userId) {
      const error = createErrorResponse("UNAUTHORIZED", "Authentication required", undefined, 401);
      return NextResponse.json(error.body, { status: error.status });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: Record<string, string> = { userId, type: "PAYMENT" };
    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      prisma.transaction.count({ where }),
    ]);

    const response = createApiResponse(payments, request, { page, perPage, total });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to fetch payments", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("wedupay-user-id")?.value;

    if (!userId) {
      const error = createErrorResponse("UNAUTHORIZED", "Authentication required", undefined, 401);
      return NextResponse.json(error.body, { status: error.status });
    }

    const body = await request.json();
    const { amount, currency, provider, phoneNumber, reference, description } = body;

    const errors: Array<{ code: string; target: string; message: string }> = [];
    if (!amount) errors.push({ code: "REQUIRED", target: "amount", message: "Amount is required" });
    if (!currency) errors.push({ code: "REQUIRED", target: "currency", message: "Currency is required" });
    if (!provider) errors.push({ code: "REQUIRED", target: "provider", message: "Provider is required" });
    if (!phoneNumber) errors.push({ code: "REQUIRED", target: "phoneNumber", message: "Phone number is required" });

    if (errors.length > 0) {
      const error = createErrorResponse("VALIDATION_ERROR", "Invalid request data", errors, 400);
      return NextResponse.json(error.body, { status: error.status });
    }

    if (!MOBILE_MONEY_PROVIDERS.includes(provider)) {
      const error = createErrorResponse(
        "INVALID_PROVIDER",
        `Provider must be one of: ${MOBILE_MONEY_PROVIDERS.join(", ")}`,
        undefined,
        400
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    if (amount <= 0) {
      const error = createErrorResponse("INVALID_AMOUNT", "Amount must be greater than 0", undefined, 400);
      return NextResponse.json(error.body, { status: error.status });
    }

    const transactionRef = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        currency,
        status: "PENDING",
        type: "PAYMENT",
        reference: transactionRef,
      },
    });

    const response = {
      data: {
        id: transaction.id,
        type: "payment",
        attributes: {
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          reference: transaction.reference,
          provider,
          phoneNumber,
          description,
          createdAt: transaction.createdAt,
        },
      },
      links: {
        self: buildResourceUrl(request, transaction.id),
        resource: buildResourceUrl(request),
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Failed to process payment:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to process payment", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}
