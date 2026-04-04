import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse, getCacheHeaders } from "@/lib/api-response";
import { getSecurityHeaders } from "@/lib/api-middleware";
import { checkConditionalRequest, generateETag } from "@/lib/content-negotiation";
import { authenticateRequest, requireAuth, requireAppUser } from "@/lib/auth";

function buildResourceUrl(request: Request, id?: string): string {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}/api/v1/transfers`;
  return id ? `${baseUrl}/${id}` : baseUrl;
}

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

    const transfer = await prisma.transaction.findFirst({
      where: { id, userId, type: { in: ["TRANSFER", "TRANSFER_RECEIVED"] } },
    });

    if (!transfer) {
      const error = createErrorResponse("NOT_FOUND", "Transfer not found", undefined, 404);
      return NextResponse.json(error.body, { status: error.status });
    }

    const etag = generateETag(transfer);
    const conditional = checkConditionalRequest(request, etag, transfer.createdAt);

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
        id: transfer.id,
        type: "transfer",
        attributes: {
          amount: transfer.amount,
          currency: transfer.currency,
          status: transfer.status,
          type: transfer.type,
          reference: transfer.reference,
          createdAt: transfer.createdAt,
        },
        _links: {
          self: { href: buildResourceUrl(request, transfer.id) },
          collection: { href: buildResourceUrl(request) },
        },
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        ...getCacheHeaders(false, transfer.createdAt),
        ...getSecurityHeaders(),
        "ETag": etag,
        "Last-Modified": transfer.createdAt.toUTCString(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch transfer:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to fetch transfer", undefined, 500);
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
    const { description } = body;

    const transfer = await prisma.transaction.findFirst({
      where: { id, userId, type: "TRANSFER" },
    });

    if (!transfer) {
      const error = createErrorResponse("NOT_FOUND", "Transfer not found", undefined, 404);
      return NextResponse.json(error.body, { status: error.status });
    }

    if (transfer.status !== "PENDING") {
      const error = createErrorResponse(
        "CANNOT_UPDATE",
        "Only pending transfers can be updated",
        undefined,
        409
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    const updatedTransfer = await prisma.transaction.update({
      where: { id },
      data: {
        reference: description || transfer.reference,
      },
    });

    const response = {
      data: {
        id: updatedTransfer.id,
        type: "transfer",
        attributes: {
          amount: updatedTransfer.amount,
          currency: updatedTransfer.currency,
          status: updatedTransfer.status,
          type: updatedTransfer.type,
          reference: updatedTransfer.reference,
          createdAt: updatedTransfer.createdAt,
        },
        _links: {
          self: { href: buildResourceUrl(request, updatedTransfer.id) },
          collection: { href: buildResourceUrl(request) },
        },
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        ...getCacheHeaders(false, updatedTransfer.createdAt),
        ...getSecurityHeaders(),
      },
    });
  } catch (error) {
    console.error("Failed to update transfer:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to update transfer", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

export async function PATCH(
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
    const operations = await request.json();

    if (!Array.isArray(operations)) {
      const error = createErrorResponse("INVALID_REQUEST", "PATCH body must be an array of operations", undefined, 400);
      return NextResponse.json(error.body, { status: error.status });
    }

    const transfer = await prisma.transaction.findFirst({
      where: { id, userId, type: "TRANSFER" },
    });

    if (!transfer) {
      const error = createErrorResponse("NOT_FOUND", "Transfer not found", undefined, 404);
      return NextResponse.json(error.body, { status: error.status });
    }

    if (transfer.status !== "PENDING") {
      const error = createErrorResponse("CANNOT_UPDATE", "Only pending transfers can be modified", undefined, 409);
      return NextResponse.json(error.body, { status: error.status });
    }

    let currentRef = transfer.reference;

    for (const op of operations) {
      if (op.op === "replace" && op.path === "/reference") {
        currentRef = op.value as string;
      }
    }

    const updatedTransfer = await prisma.transaction.update({
      where: { id },
      data: { reference: currentRef },
    });

    const response = {
      data: {
        id: updatedTransfer.id,
        type: "transfer",
        attributes: {
          amount: updatedTransfer.amount,
          currency: updatedTransfer.currency,
          status: updatedTransfer.status,
          reference: updatedTransfer.reference,
          createdAt: updatedTransfer.createdAt,
        },
        _links: {
          self: { href: buildResourceUrl(request, updatedTransfer.id) },
          collection: { href: buildResourceUrl(request) },
        },
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        ...getSecurityHeaders(),
      },
    });
  } catch (error) {
    console.error("Failed to patch transfer:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to patch transfer", undefined, 500);
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

    const transfer = await prisma.transaction.findFirst({
      where: { id, userId, type: "TRANSFER" },
    });

    if (!transfer) {
      const error = createErrorResponse("NOT_FOUND", "Transfer not found", undefined, 404);
      return NextResponse.json(error.body, { status: error.status });
    }

    if (transfer.status !== "PENDING") {
      const error = createErrorResponse("CANNOT_DELETE", "Only pending transfers can be cancelled", undefined, 409);
      return NextResponse.json(error.body, { status: error.status });
    }

    await prisma.transaction.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return new NextResponse(null, {
      status: 204,
      headers: {
        ...getSecurityHeaders(),
        "X-Request-Id": crypto.randomUUID(),
      },
    });
  } catch (error) {
    console.error("Failed to delete transfer:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to delete transfer", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

export async function HEAD(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !auth.userId) {
      return new NextResponse(null, { status: 401 });
    }
    const userId = auth.userId;

    const { id } = await params;

    const transfer = await prisma.transaction.findFirst({
      where: { id, userId, type: { in: ["TRANSFER", "TRANSFER_RECEIVED"] } },
    });

    if (!transfer) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        "ETag": generateETag(transfer),
        "Last-Modified": transfer.createdAt.toUTCString(),
        "X-Resource-Type": "transfer",
        ...getSecurityHeaders(),
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
