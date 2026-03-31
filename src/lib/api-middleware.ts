import { NextResponse } from "next/server";
import { createErrorResponse } from "./api-response";

const TIMESTAMP_TOLERANCE_SECONDS = 30;

export function validateRequestTimestamp(request: Request): NextResponse | null {
  const timestampHeader = request.headers.get("X-Timestamp");
  const nonceHeader = request.headers.get("X-Nonce");

  if (!timestampHeader) {
    return null;
  }

  const requestTimestamp = parseInt(timestampHeader, 10);

  if (isNaN(requestTimestamp)) {
    return NextResponse.json(
      createErrorResponse("INVALID_TIMESTAMP", "X-Timestamp header must be a valid Unix timestamp").body,
      { status: 400 }
    );
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const timeDifference = Math.abs(currentTimestamp - requestTimestamp);

  if (timeDifference > TIMESTAMP_TOLERANCE_SECONDS) {
    return NextResponse.json(
      createErrorResponse(
        "REQUEST_EXPIRED",
        `Request timestamp is outside acceptable range (±${TIMESTAMP_TOLERANCE_SECONDS} seconds)`,
        undefined,
        401
      ).body,
      { status: 401 }
    );
  }

  return null;
}

export function validateRequiredHeaders(request: Request, requiredHeaders: string[]): NextResponse | null {
  for (const header of requiredHeaders) {
    if (!request.headers.has(header)) {
      return NextResponse.json(
        createErrorResponse("MISSING_HEADER", `Required header '${header}' is missing`, undefined, 400).body,
        { status: 400 }
      );
    }
  }
  return null;
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 1000);
}

export function validatePaginationParams(params: {
  page?: string;
  perPage?: string;
}): { page: number; perPage: number; error?: NextResponse } {
  let page = parseInt(params.page || "1", 10);
  let perPage = parseInt(params.perPage || "20", 10);

  if (isNaN(page) || page < 1) {
    page = 1;
  }

  if (isNaN(perPage) || perPage < 1) {
    perPage = 20;
  }

  if (perPage > 100) {
    perPage = 100;
  }

  return { page, perPage };
}

export function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'none'",
  };
}
