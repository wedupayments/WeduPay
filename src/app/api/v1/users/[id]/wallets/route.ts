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

    const currency = searchParams.get("currency");
    const walletType = searchParams.get("walletType");

    const where: Record<string, string> = { userId };
    if (currency) where.currency = currency;
    if (walletType) where.walletType = walletType;

    const [wallets, total] = await Promise.all([
      prisma.wallet.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      prisma.wallet.count({ where }),
    ]);

    const response = createApiResponse(wallets, request, { page, perPage, total });
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
    console.error("Failed to fetch user wallets:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to fetch wallets", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}
