import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createErrorResponse, getCacheHeaders } from "@/lib/api-response";
import { getSecurityHeaders } from "@/lib/api-middleware";

function buildResourceUrl(request: Request, id?: string): string {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}/api/v1/payments`;
  return id ? `${baseUrl}/${id}` : baseUrl;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("wedupay-user-id")?.value;

    if (!userId) {
      const error = createErrorResponse("UNAUTHORIZED", "Authentication required", undefined, 401);
      return NextResponse.json(error.body, { status: error.status });
    }

    const { id } = await params;

    const payment = await prisma.transaction.findFirst({
      where: { id, userId, type: "PAYMENT" },
    });

    if (!payment) {
      const error = createErrorResponse("NOT_FOUND", "Payment not found", undefined, 404);
      return NextResponse.json(error.body, { status: error.status });
    }

    const response = {
      data: {
        id: payment.id,
        type: "payment",
        attributes: {
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          reference: payment.reference,
          type: payment.type,
          createdAt: payment.createdAt,
        },
        _links: {
          self: { href: buildResourceUrl(request, payment.id) },
          cancel: { href: `${buildResourceUrl(request, payment.id)}/cancel` },
          collection: { href: buildResourceUrl(request) },
        },
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        ...getCacheHeaders(false, payment.createdAt),
        ...getSecurityHeaders(),
        "Last-Modified": payment.createdAt.toUTCString(),
      },
    });
  } catch (error) {
    console.error("Failed to fetch payment:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to fetch payment", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("wedupay-user-id")?.value;

    if (!userId) {
      const error = createErrorResponse("UNAUTHORIZED", "Authentication required", undefined, 401);
      return NextResponse.json(error.body, { status: error.status });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, description } = body;

    const payment = await prisma.transaction.findFirst({
      where: { id, userId, type: "PAYMENT" },
    });

    if (!payment) {
      const error = createErrorResponse("NOT_FOUND", "Payment not found", undefined, 404);
      return NextResponse.json(error.body, { status: error.status });
    }

    const validStatuses = ["PENDING", "COMPLETED", "FAILED", "CANCELLED"];
    if (status && !validStatuses.includes(status)) {
      const error = createErrorResponse(
        "INVALID_STATUS",
        `Status must be one of: ${validStatuses.join(", ")}`,
        undefined,
        400
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    const updatedPayment = await prisma.transaction.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(description !== undefined && { reference: description }),
      },
    });

    const response = {
      data: {
        id: updatedPayment.id,
        type: "payment",
        attributes: {
          amount: updatedPayment.amount,
          currency: updatedPayment.currency,
          status: updatedPayment.status,
          reference: updatedPayment.reference,
          type: updatedPayment.type,
          createdAt: updatedPayment.createdAt,
          updatedAt: updatedPayment.createdAt,
        },
        _links: {
          self: { href: buildResourceUrl(request, updatedPayment.id) },
          collection: { href: buildResourceUrl(request) },
        },
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        ...getCacheHeaders(false, updatedPayment.createdAt),
        ...getSecurityHeaders(),
      },
    });
  } catch (error) {
    console.error("Failed to update payment:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to update payment", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("wedupay-user-id")?.value;

    if (!userId) {
      const error = createErrorResponse("UNAUTHORIZED", "Authentication required", undefined, 401);
      return NextResponse.json(error.body, { status: error.status });
    }

    const { id } = await params;

    const payment = await prisma.transaction.findFirst({
      where: { id, userId, type: "PAYMENT" },
    });

    if (!payment) {
      const error = createErrorResponse("NOT_FOUND", "Payment not found", undefined, 404);
      return NextResponse.json(error.body, { status: error.status });
    }

    if (payment.status === "COMPLETED") {
      const error = createErrorResponse(
        "CANNOT_DELETE",
        "Cannot delete a completed payment",
        undefined,
        409
      );
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
    console.error("Failed to delete payment:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to delete payment", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

type PatchOperation = {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("wedupay-user-id")?.value;

    if (!userId) {
      const error = createErrorResponse("UNAUTHORIZED", "Authentication required", undefined, 401);
      return NextResponse.json(error.body, { status: error.status });
    }

    const { id } = await params;
    const operations: PatchOperation[] = await request.json();

    if (!Array.isArray(operations)) {
      const error = createErrorResponse("INVALID_REQUEST", "PATCH body must be an array of operations", undefined, 400);
      return NextResponse.json(error.body, { status: error.status });
    }

    const payment = await prisma.transaction.findFirst({
      where: { id, userId, type: "PAYMENT" },
    });

    if (!payment) {
      const error = createErrorResponse("NOT_FOUND", "Payment not found", undefined, 404);
      return NextResponse.json(error.body, { status: error.status });
    }

    let currentData = {
      status: payment.status,
      reference: payment.reference,
    };

    for (const op of operations) {
      switch (op.op) {
        case "replace":
          if (op.path === "/status") {
            const validStatuses = ["PENDING", "COMPLETED", "FAILED", "CANCELLED"];
            if (!op.value || !validStatuses.includes(op.value as string)) {
              const error = createErrorResponse(
                "INVALID_OPERATION",
                `Invalid status value. Must be one of: ${validStatuses.join(", ")}`,
                undefined,
                400
              );
              return NextResponse.json(error.body, { status: error.status });
            }
            currentData.status = op.value as string;
          } else if (op.path === "/reference") {
            currentData.reference = op.value as string;
          } else {
            const error = createErrorResponse(
              "INVALID_PATH",
              `Cannot replace path: ${op.path}. Only /status and /reference are allowed.`,
              undefined,
              400
            );
            return NextResponse.json(error.body, { status: error.status });
          }
          break;

        case "test":
          if (op.path === "/status" && currentData.status !== op.value) {
            const error = createErrorResponse("TEST_FAILED", "Test operation failed", undefined, 412);
            return NextResponse.json(error.body, { status: error.status });
          }
          break;

        default:
          const error = createErrorResponse(
            "UNSUPPORTED_OPERATION",
            `Operation '${op.op}' is not supported. Use 'replace' or 'test'.`,
            undefined,
            400
          );
          return NextResponse.json(error.body, { status: error.status });
      }
    }

    const updatedPayment = await prisma.transaction.update({
      where: { id },
      data: {
        status: currentData.status,
        reference: currentData.reference,
      },
    });

    const response = {
      data: {
        id: updatedPayment.id,
        type: "payment",
        attributes: {
          amount: updatedPayment.amount,
          currency: updatedPayment.currency,
          status: updatedPayment.status,
          reference: updatedPayment.reference,
          type: updatedPayment.type,
          createdAt: updatedPayment.createdAt,
        },
        _links: {
          self: { href: buildResourceUrl(request, updatedPayment.id) },
          collection: { href: buildResourceUrl(request) },
        },
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        ...getCacheHeaders(false, updatedPayment.createdAt),
        ...getSecurityHeaders(),
      },
    });
  } catch (error) {
    console.error("Failed to patch payment:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to patch payment", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}
