import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse, createApiResponse, getCacheHeaders } from "@/lib/api-response";
import { getSecurityHeaders } from "@/lib/api-middleware";

function generateApiKey(): string {
  const prefix = "wpy";
  const randomPart = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  return `${prefix}_${randomPart}`;
}

export class ApiKeyController {
  async list(request: Request, userId: string) {
    try {
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
            id: true, name: true, permissions: true, isActive: true,
            lastUsedAt: true, expiresAt: true, createdAt: true, key: true,
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
        headers: { ...getCacheHeaders(true), ...getSecurityHeaders() },
      });
    } catch (error) {
      console.error("[ApiKeyController] list error:", error);
      const err = createErrorResponse("INTERNAL_ERROR", "Failed to fetch API keys", undefined, 500);
      return NextResponse.json(err.body, { status: err.status });
    }
  }

  async create(request: Request, userId: string) {
    try {
      const body = await request.json();
      const { name, permissions, expiresInDays } = body;

      if (!name) {
        const err = createErrorResponse("VALIDATION_ERROR", "name is required", undefined, 400);
        return NextResponse.json(err.body, { status: err.status });
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
          key, name, userId,
          permissions: permissions || ["read", "write"],
          expiresAt,
        },
      });

      return NextResponse.json({
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
          _meta: { warning: "Store this key securely. It will not be shown again." },
        },
        _links: { self: { href: `/api/v1/api-keys/${apiKey.id}` } },
      }, {
        status: 201,
        headers: { "Location": `/api/v1/api-keys/${apiKey.id}`, ...getSecurityHeaders() },
      });
    } catch (error) {
      console.error("[ApiKeyController] create error:", error);
      const err = createErrorResponse("INTERNAL_ERROR", "Failed to create API key", undefined, 500);
      return NextResponse.json(err.body, { status: err.status });
    }
  }

  async get(request: Request, id: string, userId: string) {
    try {
      const apiKey = await prisma.apiKey.findFirst({ where: { id, userId } });
      if (!apiKey) {
        const err = createErrorResponse("NOT_FOUND", "API key not found", undefined, 404);
        return NextResponse.json(err.body, { status: err.status });
      }

      return NextResponse.json({
        data: {
          id: apiKey.id,
          type: "api-key",
          attributes: {
            name: apiKey.name,
            key: `${apiKey.key.slice(0, 8)}...${apiKey.key.slice(-4)}`,
            permissions: apiKey.permissions,
            isActive: apiKey.isActive,
            lastUsedAt: apiKey.lastUsedAt,
            expiresAt: apiKey.expiresAt,
            createdAt: apiKey.createdAt,
          },
          _links: { self: { href: `/api/v1/api-keys/${apiKey.id}` } },
        },
      }, {
        status: 200,
        headers: { ...getCacheHeaders(false, apiKey.createdAt), ...getSecurityHeaders() },
      });
    } catch (error) {
      console.error("[ApiKeyController] get error:", error);
      const err = createErrorResponse("INTERNAL_ERROR", "Failed to fetch API key", undefined, 500);
      return NextResponse.json(err.body, { status: err.status });
    }
  }

  async update(request: Request, id: string, userId: string) {
    try {
      const body = await request.json();
      const { name, permissions, isActive } = body;

      const existingKey = await prisma.apiKey.findFirst({ where: { id, userId } });
      if (!existingKey) {
        const err = createErrorResponse("NOT_FOUND", "API key not found", undefined, 404);
        return NextResponse.json(err.body, { status: err.status });
      }

      const updatedKey = await prisma.apiKey.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(permissions !== undefined && { permissions }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      return NextResponse.json({
        data: {
          id: updatedKey.id,
          type: "api-key",
          attributes: {
            name: updatedKey.name,
            key: `${updatedKey.key.slice(0, 8)}...${updatedKey.key.slice(-4)}`,
            permissions: updatedKey.permissions,
            isActive: updatedKey.isActive,
            lastUsedAt: updatedKey.lastUsedAt,
            expiresAt: updatedKey.expiresAt,
            createdAt: updatedKey.createdAt,
          },
          _links: { self: { href: `/api/v1/api-keys/${updatedKey.id}` } },
        },
      }, { status: 200 });
    } catch (error) {
      console.error("[ApiKeyController] update error:", error);
      const err = createErrorResponse("INTERNAL_ERROR", "Failed to update API key", undefined, 500);
      return NextResponse.json(err.body, { status: err.status });
    }
  }

  async delete(request: Request, id: string, userId: string) {
    try {
      const apiKey = await prisma.apiKey.findFirst({ where: { id, userId } });
      if (!apiKey) {
        const err = createErrorResponse("NOT_FOUND", "API key not found", undefined, 404);
        return NextResponse.json(err.body, { status: err.status });
      }

      await prisma.apiKey.delete({ where: { id } });

      return new NextResponse(null, {
        status: 204,
        headers: { ...getSecurityHeaders() },
      });
    } catch (error) {
      console.error("[ApiKeyController] delete error:", error);
      const err = createErrorResponse("INTERNAL_ERROR", "Failed to delete API key", undefined, 500);
      return NextResponse.json(err.body, { status: err.status });
    }
  }
}

export const apiKeyController = new ApiKeyController();
