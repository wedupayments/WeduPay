import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { createErrorResponse, getCacheHeaders } from "@/lib/api-response";
import { getSecurityHeaders } from "@/lib/api-middleware";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    
    if (!auth.authenticated) {
      const error = createErrorResponse("UNAUTHORIZED", "Authentication required", undefined, 401);
      return NextResponse.json(error.body, { status: error.status });
    }

    const { id } = await params;

    const task = await prisma.asyncTask.findUnique({
      where: { id },
    });

    if (!task) {
      const error = createErrorResponse("NOT_FOUND", "Task not found", undefined, 404);
      return NextResponse.json(error.body, { status: error.status });
    }

    const taskData = {
      id: task.id,
      type: task.type,
      status: task.status,
      payload: JSON.parse(task.payload),
      result: task.result ? JSON.parse(task.result) : null,
      error: task.errorMessage,
      attempts: task.attempts,
      maxAttempts: task.maxAttempts,
      scheduledAt: task.scheduledAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
    };

    return NextResponse.json(
      {
        data: {
          id: task.id,
          type: "async-task",
          attributes: taskData,
          _links: {
            self: { href: `/api/v1/tasks/${task.id}` },
          },
        },
      },
      {
        status: 200,
        headers: {
          ...getCacheHeaders(false),
          ...getSecurityHeaders(),
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch task:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to fetch task", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}
