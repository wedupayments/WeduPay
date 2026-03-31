import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createApiResponse, createErrorResponse } from "@/lib/api-response";

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
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: Record<string, unknown> = { userId };

    if (status) where.status = status;
    if (type) where.type = type;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: perPage,
        skip: (page - 1) * perPage,
        include: {
          user: {
            select: { email: true, phoneNumber: true },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    const formattedTransactions = transactions.map((tx) => ({
      id: tx.id,
      type: "transaction",
      attributes: {
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        transactionType: tx.type,
        reference: tx.reference,
        createdAt: tx.createdAt,
      },
      relationships: {
        user: tx.user ? { email: tx.user.email, phoneNumber: tx.user.phoneNumber } : null,
      },
    }));

    const response = createApiResponse(formattedTransactions, request, { page, perPage, total });
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to fetch transactions", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}
