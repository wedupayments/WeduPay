import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createApiResponse, createErrorResponse, getCacheHeaders } from "@/lib/api-response";
import { validatePaginationParams, getSecurityHeaders } from "@/lib/api-middleware";
import { 
  getPreferredContentType, 
  parseFieldsParam, 
  parseSortParam, 
  parseExpandParam,
  buildCsvResponse 
} from "@/lib/content-negotiation";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("wedupay-user-id")?.value;

    if (!userId) {
      const error = createErrorResponse("UNAUTHORIZED", "Authentication required", undefined, 401);
      return NextResponse.json(error.body, { status: error.status });
    }

    const { searchParams } = new URL(request.url);
    const { page, perPage } = validatePaginationParams({
      page: searchParams.get("page") || undefined,
      perPage: searchParams.get("perPage") || undefined,
    });

    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const currency = searchParams.get("currency");
    const sortParam = searchParams.get("sort");
    const fields = parseFieldsParam(searchParams.get("fields"));
    const expand = parseExpandParam(searchParams.get("expand"));

    const contentType = getPreferredContentType(request.headers.get("Accept"));

    const where: Record<string, unknown> = { userId };

    if (status) where.status = status;
    if (type) where.type = type;
    if (currency) where.currency = currency;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) (where.amount as Record<string, number>).gte = parseFloat(minAmount);
      if (maxAmount) (where.amount as Record<string, number>).lte = parseFloat(maxAmount);
    }

    const orderBy = parseSortParam(sortParam || "-createdAt");

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: orderBy.map((o) => ({ [o.field]: o.direction })),
        take: perPage,
        skip: (page - 1) * perPage,
        include: {
          user: expand.includes("user") ? {
            select: { email: true, phoneNumber: true },
          } : undefined,
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    const formattedTransactions = transactions.map((tx) => {
      const baseTx = {
        id: tx.id,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        transactionType: tx.type,
        reference: tx.reference,
        createdAt: tx.createdAt,
        user: tx.user,
      };

      if (fields.length > 0) {
        return Object.fromEntries(
          Object.entries(baseTx).filter(([key]) => fields.includes(key))
        );
      }

      return baseTx;
    });

    const response = createApiResponse(formattedTransactions, request, { page, perPage, total });

    if (contentType === "text/csv") {
      return new Response(buildCsvResponse(formattedTransactions), {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="transactions-${Date.now()}.csv"`,
          "X-Total-Count": String(total),
          ...getSecurityHeaders(),
        },
      });
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        ...getCacheHeaders(true),
        ...getSecurityHeaders(),
        "Vary": "Accept",
      },
    });
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to fetch transactions", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}
