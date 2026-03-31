import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiResponse, createErrorResponse, buildLinkHeader, getCacheHeaders } from "@/lib/api-response";
import { validatePaginationParams, getSecurityHeaders } from "@/lib/api-middleware";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);

    const { page, perPage } = validatePaginationParams({
      page: searchParams.get("page") || undefined,
      perPage: searchParams.get("perPage") || undefined,
    });

    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
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
      }),
      prisma.transaction.count({ where }),
    ]);

    const response = createApiResponse(transactions, request, { page, perPage, total });
    const linkHeader = buildLinkHeader(request, { page, perPage, total });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        ...getCacheHeaders(true),
        ...getSecurityHeaders(),
        "Link": linkHeader,
        "X-Total-Count": String(total),
        "X-Page": String(page),
        "X-Per-Page": String(perPage),
      },
    });
  } catch (error) {
    console.error("Failed to fetch user transactions:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to fetch transactions", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}
