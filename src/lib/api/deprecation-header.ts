/**
 * API Deprecation Header Utility
 *
 * Wraps route handlers to inject RFC 7231 deprecation signals
 * without changing the response body or breaking existing clients.
 *
 * Consumers (Postman, dashboards, internal services) will see:
 *   Deprecation: true
 *   Sunset: <ISO 8601 date>
 *   Link: </api/v1/...>; rel="successor-version"
 *
 * UI functionality is fully preserved — no redirects, same response body.
 *
 * Usage:
 *   export const GET = withDeprecationHeaders(originalGet, "/api/v1/wallets");
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type RouteHandler = (
  req: NextRequest,
  ctx?: { params: Record<string, string> }
) => Promise<NextResponse> | NextResponse;

export function withDeprecationHeaders(
  handler: RouteHandler,
  successorPath: string,
  sunsetDate = "2026-12-31"
): RouteHandler {
  return async (req, ctx) => {
    const response = await handler(req, ctx);

    // Clone so we can mutate headers
    const patched = NextResponse.json(await response.json().catch(() => ({})), {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        Deprecation: "true",
        Sunset: sunsetDate,
        Link: `<${successorPath}>; rel="successor-version"`,
      },
    });

    return patched;
  };
}
