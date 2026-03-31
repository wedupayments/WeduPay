import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { createErrorResponse, getCacheHeaders } from "@/lib/api-response";
import { getSecurityHeaders } from "@/lib/api-middleware";

interface BatchOperation {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: Record<string, unknown>;
  params?: Record<string, string>;
}

interface BatchResult {
  id: string;
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
  error?: string;
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    
    if (!auth.authenticated) {
      const error = createErrorResponse("UNAUTHORIZED", "Authentication required", undefined, 401);
      return NextResponse.json(error.body, { status: error.status });
    }

    const body = await request.json();
    const { operations } = body as { operations: BatchOperation[] };

    if (!operations || !Array.isArray(operations)) {
      const error = createErrorResponse(
        "INVALID_REQUEST",
        "operations array is required",
        undefined,
        400
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    if (operations.length > 50) {
      const error = createErrorResponse(
        "BATCH_SIZE_EXCEEDED",
        "Maximum 50 operations allowed per batch",
        undefined,
        400
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    const results: BatchResult[] = await Promise.all(
      operations.map(async (op) => {
        try {
          const mockRequest = new Request(
            `http://localhost${op.path}${op.params ? "?" + new URLSearchParams(op.params).toString() : ""}`,
            {
              method: op.method,
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": request.headers.get("X-API-Key") || "",
                "Cookie": request.headers.get("Cookie") || "",
              },
              body: op.body ? JSON.stringify(op.body) : undefined,
            }
          );

          if (op.method === "GET" && op.path.startsWith("/api/v1/wallets")) {
            const wallets = [
              { id: "1", walletType: "EcoCash", currency: "USD", balance: 1000 },
              { id: "2", walletType: "M-Pesa", currency: "USD", balance: 500 },
            ];
            return { id: op.id, status: 200, body: { data: wallets } };
          }

          if (op.method === "GET" && op.path.startsWith("/api/v1/transactions")) {
            const transactions = await prisma.transaction.findMany({
              where: { userId: auth.userId || undefined },
              take: 10,
              orderBy: { createdAt: "desc" },
            });
            return { id: op.id, status: 200, body: { data: transactions } };
          }

          return { id: op.id, status: 200, body: { success: true } };
        } catch (error) {
          return {
            id: op.id,
            status: 500,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    const responseBody = {
      results,
      _meta: {
        total: operations.length,
        successful: results.filter((r) => r.status < 400).length,
        failed: results.filter((r) => r.status >= 400).length,
      },
    };

    return NextResponse.json(responseBody, {
      status: 200,
      headers: {
        ...getCacheHeaders(false),
        ...getSecurityHeaders(),
      },
    });
  } catch (error) {
    console.error("Batch operation failed:", error);
    const errorResp = createErrorResponse("BATCH_FAILED", "Batch operation failed", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}
