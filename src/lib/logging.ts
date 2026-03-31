import { prisma } from "@/lib/prisma";

export interface LogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId: string;
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  requestSize?: number;
  responseSize?: number;
}

export async function logRequest(entry: LogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        details: entry.details ? JSON.stringify(entry.details) : null,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        requestId: entry.requestId,
      },
    });
  } catch (error) {
    console.error("Failed to log request:", error);
  }
}

export function getRequestId(request: Request): string {
  return request.headers.get("X-Request-Id") || crypto.randomUUID();
}

export function extractRequestMetadata(request: Request): {
  ipAddress: string;
  userAgent: string;
  requestId: string;
} {
  const forwarded = request.headers.get("X-Forwarded-For");
  const ipAddress = forwarded?.split(",")[0].trim() || 
                    request.headers.get("X-Real-IP") || 
                    "unknown";
  const userAgent = request.headers.get("User-Agent") || "unknown";
  const requestId = getRequestId(request);

  return { ipAddress, userAgent, requestId };
}

export async function logApiRequest(
  request: Request,
  responseStatus: number,
  duration: number,
  userId?: string
): Promise<void> {
  const url = new URL(request.url);
  const pathParts = url.pathname.replace("/api/v1/", "").split("/");
  const resource = pathParts[0] || "root";
  const resourceId = pathParts[1];

  const { ipAddress, userAgent, requestId } = extractRequestMetadata(request);

  const action = `${request.method} ${resource}`;
  const method = request.method;

  await logRequest({
    userId,
    action,
    resource,
    resourceId,
    ipAddress,
    userAgent,
    requestId,
    method,
    path: url.pathname,
    statusCode: responseStatus,
    duration,
  });
}

export function createRequestLogger() {
  return async function log(
    request: Request,
    handler: () => Promise<Response>
  ): Promise<Response> {
    const startTime = Date.now();
    const requestId = getRequestId(request);

    const response = await handler();
    const duration = Date.now() - startTime;

    const responseHeaders = new Headers(response.headers);
    if (!responseHeaders.has("X-Request-Id")) {
      responseHeaders.set("X-Request-Id", requestId);
    }

    const userId = request.headers.get("X-User-Id") || undefined;

    logApiRequest(request, response.status, duration, userId).catch(() => {});

    if (response.body) {
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    }

    return new Response(null, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  };
}
