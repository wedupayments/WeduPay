import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse, getCacheHeaders } from "@/lib/api-response";
import { getSecurityHeaders } from "@/lib/api-middleware";
import { authenticateRequest, requireAuth, requireAppUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }
    const profileError = requireAppUser(auth);
    if (profileError) {
      return profileError;
    }
    const userId = auth.userId!;

    const { id } = await params;

    const apiKey = await prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      const error = createErrorResponse("NOT_FOUND", "API key not found", undefined, 404);
      return NextResponse.json(error.body, { status: error.status });
    }

    const response = {
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
        _links: {
          self: { href: `/api/v1/api-keys/${apiKey.id}` },
        },
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        ...getCacheHeaders(false, apiKey.createdAt),
        ...getSecurityHeaders(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch API key:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to fetch API key", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }
    const profileError = requireAppUser(auth);
    if (profileError) {
      return profileError;
    }
    const userId = auth.userId!;

    const { id } = await params;
    const body = await request.json();
    const { name, permissions, isActive } = body;

    const existingKey = await prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!existingKey) {
      const error = createErrorResponse("NOT_FOUND", "API key not found", undefined, 404);
      return NextResponse.json(error.body, { status: error.status });
    }

    const updatedKey = await prisma.apiKey.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(permissions !== undefined && { permissions }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    const response = {
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
        _links: {
          self: { href: `/api/v1/api-keys/${updatedKey.id}` },
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to update API key:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to update API key", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    const authError = requireAuth(auth);
    if (authError) {
      return authError;
    }
    const profileError = requireAppUser(auth);
    if (profileError) {
      return profileError;
    }
    const userId = auth.userId!;

    const { id } = await params;

    const apiKey = await prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      const error = createErrorResponse("NOT_FOUND", "API key not found", undefined, 404);
      return NextResponse.json(error.body, { status: error.status });
    }

    await prisma.apiKey.delete({
      where: { id },
    });

    return new NextResponse(null, {
      status: 204,
      headers: {
        ...getSecurityHeaders(),
      },
    });
  } catch (error) {
    console.error("Failed to delete API key:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to delete API key", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}
