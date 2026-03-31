import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function corsMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  const allowedOrigins = [
    "http://localhost:3000",
    "https://wedupay.com",
  ];

  const origin = request.headers.get("origin");
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    response.headers.set("Access-Control-Allow-Origin", "*");
  }

  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD");
  response.headers.set("Access-Control-Allow-Headers", [
    "Content-Type",
    "Authorization",
    "X-API-Key",
    "X-Request-Id",
    "X-Timestamp",
    "X-Nonce",
    "Idempotency-Key",
    "Accept",
    "Accept-Language",
    "Origin",
  ].join(", "));
  
  response.headers.set("Access-Control-Max-Age", "86400");
  response.headers.set("Access-Control-Expose-Headers", [
    "X-Request-Id",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
    "Link",
    "Location",
    "Retry-After",
  ].join(", "));

  return response;
}

export function addCorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD");
  headers.set("Access-Control-Allow-Headers", [
    "Content-Type",
    "Authorization",
    "X-API-Key",
    "X-Request-Id",
    "Accept",
  ].join(", "));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
