import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { createErrorResponse } from "@/lib/api-response";
import { getSecurityHeaders } from "@/lib/api-middleware";

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    
    if (!auth.authenticated) {
      const error = createErrorResponse("UNAUTHORIZED", "Authentication required", undefined, 401);
      return NextResponse.json(error.body, { status: error.status });
    }

    const body = await request.json();
    const { type, payload } = body;

    if (!type || !payload) {
      const error = createErrorResponse(
        "INVALID_REQUEST",
        "type and payload are required",
        undefined,
        400
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    const validTypes = [
      "PAYMENT_BULK",
      "TRANSFER_BULK",
      "REFUND",
      "EXPORT",
      "IMPORT",
      "RECONCILIATION",
    ];

    if (!validTypes.includes(type)) {
      const error = createErrorResponse(
        "INVALID_TASK_TYPE",
        `Task type must be one of: ${validTypes.join(", ")}`,
        undefined,
        400
      );
      return NextResponse.json(error.body, { status: error.status });
    }

    const scheduledAt = new Date();
    scheduledAt.setSeconds(scheduledAt.getSeconds() + 1);

    const task = await prisma.asyncTask.create({
      data: {
        id: crypto.randomUUID(),
        type,
        status: "PENDING",
        payload: JSON.stringify(payload),
        scheduledAt,
      },
    });

    const taskUrl = `/api/v1/tasks/${task.id}`;

    const response = {
      data: {
        id: task.id,
        type: "async-task",
        attributes: {
          type: task.type,
          status: task.status,
          scheduledAt: task.scheduledAt,
        },
        _links: {
          self: { href: taskUrl },
          status: { href: taskUrl },
        },
      },
      meta: {
        taskId: task.id,
        statusUrl: taskUrl,
      },
    };

    return NextResponse.json(response, {
      status: 202,
      headers: {
        "Content-Type": "application/json",
        "Location": taskUrl,
        "X-Request-Id": crypto.randomUUID(),
        ...getSecurityHeaders(),
      },
    });
  } catch (error) {
    console.error("Failed to create task:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to create task", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    
    if (!auth.authenticated) {
      const error = createErrorResponse("UNAUTHORIZED", "Authentication required", undefined, 401);
      return NextResponse.json(error.body, { status: error.status });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "20");

    const where: Record<string, string> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [tasks, total] = await Promise.all([
      prisma.asyncTask.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      prisma.asyncTask.count({ where }),
    ]);

    const response = {
      data: tasks.map((task) => ({
        id: task.id,
        type: "async-task",
        attributes: {
          type: task.type,
          status: task.status,
          attempts: task.attempts,
          scheduledAt: task.scheduledAt,
          startedAt: task.startedAt,
          completedAt: task.completedAt,
          createdAt: task.createdAt,
        },
        _links: {
          self: { href: `/api/v1/tasks/${task.id}` },
        },
      })),
      _meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      _links: {
        self: `/api/v1/tasks?page=${page}&perPage=${perPage}`,
        first: `/api/v1/tasks?page=1&perPage=${perPage}`,
        last: `/api/v1/tasks?page=${Math.ceil(total / perPage)}&perPage=${perPage}`,
        ...(page > 1 && { prev: `/api/v1/tasks?page=${page - 1}&perPage=${perPage}` }),
        ...(page < Math.ceil(total / perPage) && { next: `/api/v1/tasks?page=${page + 1}&perPage=${perPage}` }),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    const errorResp = createErrorResponse("INTERNAL_ERROR", "Failed to fetch tasks", undefined, 500);
    return NextResponse.json(errorResp.body, { status: errorResp.status });
  }
}
