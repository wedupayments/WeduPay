import { NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-response";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 100;

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    requestCounts.set(identifier, { count: 1, resetAt });
    return {
      allowed: true,
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetAt,
    };
  }

  record.count++;
  requestCounts.set(identifier, record);

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfter,
    };
  }

  return {
    allowed: true,
    limit: MAX_REQUESTS_PER_WINDOW,
    remaining: MAX_REQUESTS_PER_WINDOW - record.count,
    resetAt: record.resetAt,
  };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
  };

  if (result.retryAfter) {
    headers["Retry-After"] = String(result.retryAfter);
  }

  return headers;
}

export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const error = createErrorResponse(
    "RATE_LIMIT_EXCEEDED",
    `Rate limit exceeded. Please retry after ${result.retryAfter} seconds.`,
    undefined,
    429
  );

  return NextResponse.json(error.body, {
    status: 429,
    headers: getRateLimitHeaders(result),
  });
}

export async function persistRateLimit(
  _identifier: string,
  _endpoint: string,
  _result: RateLimitResult
): Promise<void> {
  // Database logging is disabled in the Edge/Proxy layer for performance and security
  return;
}

export function getClientIdentifier(request: Request): string {
  const apiKey = request.headers.get("X-API-Key");
  if (apiKey) {
    return `api_key:${apiKey}`;
  }

  const forwarded = request.headers.get("X-Forwarded-For");
  if (forwarded) {
    return `ip:${forwarded.split(",")[0].trim()}`;
  }

  return `ip:${request.headers.get("X-Real-IP") || "unknown"}`;
}
