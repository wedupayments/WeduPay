import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse, getCacheHeaders } from "@/lib/api-response";
import { getSecurityHeaders } from "@/lib/api-middleware";
import { checkConditionalRequest, generateETag } from "@/lib/content-negotiation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const expand = searchParams.get("expand");

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        wallets: {
          select: {
            id: true,
            walletType: true,
            currency: true,
            balance: true,
            createdAt: true,
          },
        },
        _count: {
          select: { transactions: true, references: true },
        },
      },
    });

    if (!user) {
      const error = createErrorResponse("NOT_FOUND", "User not found", undefined, 404);
      return NextResponse.json(error.body, { status: error.status });
    }

    const userData = {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      country: user.country,
      kycStatus: user.kycStatus,
      createdAt: user.createdAt,
      wallets: expand?.includes("wallets") ? user.wallets : undefined,
      transactionCount: user._count.transactions,
      referenceCount: user._count.references,
      _links: {
        self: { href: `/api/v1/users/${user.id}` },
        wallets: { href: `/api/v1/users/${user.id}/wallets` },
        transactions: { href: `/api/v1/users/${user.id}/transactions` },
      },
    };

    const etag = generateETag(userData);
    const conditional = checkConditionalRequest(request, etag, user.createdAt);

    if (conditional.shouldReturn304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          "ETag": conditional.etag || etag,
          ...getSecurityHeaders(),
        },
      });
    }

    const response = {
      data: {
        id: user.id,
        type: "user",
        attributes: userData,
        _links: userData._links,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        ...getCacheHeaders(false, user.createdAt),
        ...getSecurityHeaders(),
        "ETag": etag,
        "Last-Modified": user.createdAt.toUTCString(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to fetch user", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}
