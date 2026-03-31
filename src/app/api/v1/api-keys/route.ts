import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse, createApiResponse, getCacheHeaders } from "@/lib/api-response";
import { getSecurityHeaders } from "@/lib/api-middleware";
import { cookies } from "next/headers";

function generateApiKey(): string {
  const prefix = "wpy";
  const randomPart = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  return `${prefix}_${randomPart}`;
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
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "20");

    const [apiKeys, total] = await Promise.all([
      prisma.apiKey.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: perPage,
        skip: (page - 1) * perPage,
        select: {
          id: true,
          name: true,
          permissions: true,
          isActive: true,
          lastUsedAt: true,
          expiresAt: true,
          createdAt: true,
          key: true,
        },
      }),
      prisma.apiKey.count({ where: { userId } }),
    ]);

    const maskedKeys = apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      key: `${key.key.slice(0, 8)}...${key.key.slice(-4)}`,
      permissions: key.permissions,
      isActive: key.isActive,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    }));

    const response = createApiResponse(maskedKeys, request, { page, perPage, total });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        ...getCacheHeaders(true),
        ...getSecurityHeaders(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch API keys:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to fetch API keys", undefined, 500);
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
    const { name, permissions, expiresInDays } = body;

    if (!name) {
      const error = createErrorResponse("VALIDATION_ERROR", "name is required", undefined, 400);
      return NextResponse.json(error.body, { status: error.status });
    }

    const key = generateApiKey();

    let expiresAt: Date | undefined;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const apiKey = await prisma.apiKey.create({
      data: {
        id: crypto.randomUUID(),
        key,
        name,
        userId,
        permissions: permissions || ["read", "write"],
        expiresAt,
      },
    });

    const response = {
      data: {
        id: apiKey.id,
        type: "api-key",
        attributes: {
          name: apiKey.name,
          key: apiKey.key,
          permissions: apiKey.permissions,
          isActive: apiKey.isActive,
          expiresAt: apiKey.expiresAt,
          createdAt: apiKey.createdAt,
        },
        _meta: {
          warning: "Store this key securely. It will not be shown again.",
        },
      },
      _links: {
        self: { href: `/api/v1/api-keys/${apiKey.id}` },
      },
    };

    return NextResponse.json(response, {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Location": `/api/v1/api-keys/${apiKey.id}`,
        ...getSecurityHeaders(),
      },
    });
  } catch (error) {
    console.error("Failed to create API key:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to create API key", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}
