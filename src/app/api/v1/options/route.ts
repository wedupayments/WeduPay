import { NextResponse } from "next/server";

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
const ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-API-Key",
  "X-Request-Id",
  "X-Timestamp",
  "X-Nonce",
  "Idempotency-Key",
  "Accept",
  "Accept-Language",
];

export async function OPTIONS(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname;

  const endpoints: Record<string, { methods: string[]; allowHeaders: string[] }> = {
    "/api/v1/payments": {
      methods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ALLOWED_HEADERS,
    },
    "/api/v1/payments/[id]": {
      methods: ["GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ALLOWED_HEADERS,
    },
    "/api/v1/transfers": {
      methods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ALLOWED_HEADERS,
    },
    "/api/v1/transactions": {
      methods: ["GET", "OPTIONS"],
      allowHeaders: ALLOWED_HEADERS,
    },
    "/api/v1/wallets": {
      methods: ["GET", "OPTIONS"],
      allowHeaders: ALLOWED_HEADERS,
    },
    "/api/v1/users": {
      methods: ["GET", "OPTIONS"],
      allowHeaders: ALLOWED_HEADERS,
    },
    "/api/v1/users/[id]": {
      methods: ["GET", "OPTIONS"],
      allowHeaders: ALLOWED_HEADERS,
    },
    "/api/v1/health": {
      methods: ["GET", "HEAD", "OPTIONS"],
      allowHeaders: ALLOWED_HEADERS,
    },
    "/api/v1/batch": {
      methods: ["POST", "OPTIONS"],
      allowHeaders: ALLOWED_HEADERS,
    },
    "/api/v1/tasks/[id]": {
      methods: ["GET", "OPTIONS"],
      allowHeaders: ALLOWED_HEADERS,
    },
    "/api/v1/webhooks/mpesa": {
      methods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "X-Signature"],
    },
    "/api/v1/webhooks/ecocash": {
      methods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "X-Signature"],
    },
    "/api/v1/webhooks/mtn": {
      methods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "X-Signature"],
    },
  };

  let endpointConfig = endpoints[path];
  
  for (const [pattern, config] of Object.entries(endpoints)) {
    if (path.startsWith(pattern.replace("[id]", ""))) {
      endpointConfig = config;
      break;
    }
  }

  const methods = endpointConfig?.methods || ALLOWED_METHODS;
  const allowHeaders = endpointConfig?.allowHeaders || ALLOWED_HEADERS;

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": methods.join(", "),
      "Access-Control-Allow-Headers": allowHeaders.join(", "),
      "Access-Control-Max-Age": "86400",
      "Access-Control-Expose-Headers": [
        "X-Request-Id",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
        "Link",
      ].join(", "),
      "Allow": methods.join(", "),
      "X-API-Version": "1.0.0",
    },
  });
}
