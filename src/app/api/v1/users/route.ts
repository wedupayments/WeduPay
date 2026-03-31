import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiResponse, createErrorResponse, getCacheHeaders } from "@/lib/api-response";
import { validatePaginationParams, getSecurityHeaders } from "@/lib/api-middleware";
import { parseFieldsParam } from "@/lib/content-negotiation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, perPage } = validatePaginationParams({
      page: searchParams.get("page") || undefined,
      perPage: searchParams.get("perPage") || undefined,
    });

    const email = searchParams.get("email");
    const phone = searchParams.get("phoneNumber");
    const kycStatus = searchParams.get("kycStatus");
    const country = searchParams.get("country");
    const fields = parseFieldsParam(searchParams.get("fields"));

    const where: Record<string, string> = {};
    if (email) where.email = email;
    if (phone) where.phoneNumber = phone;
    if (kycStatus) where.kycStatus = kycStatus;
    if (country) where.country = country;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: perPage,
        skip: (page - 1) * perPage,
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          country: true,
          kycStatus: true,
          createdAt: true,
          _count: { select: { wallets: true, transactions: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const formattedUsers = users.map((user) => {
      const baseUser = {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        country: user.country,
        kycStatus: user.kycStatus,
        createdAt: user.createdAt,
        walletCount: user._count.wallets,
        transactionCount: user._count.transactions,
      };

      if (fields.length > 0) {
        return Object.fromEntries(
          Object.entries(baseUser).filter(([key]) => fields.includes(key))
        );
      }

      return baseUser;
    });

    const response = createApiResponse(formattedUsers, request, { page, perPage, total });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        ...getCacheHeaders(true),
        ...getSecurityHeaders(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to fetch users", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}
