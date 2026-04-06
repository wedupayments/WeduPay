/**
 * API Route Redirect Utility
 *
 * Used to issue 308 Permanent Redirects from legacy unversioned routes
 * to their /api/v1/ equivalents.
 *
 * 308 (Permanent Redirect) is used instead of 301 because 308 preserves
 * the original HTTP method (important for POST/PUT/DELETE requests).
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirects an unversioned route to the /api/v1/ equivalent.
 *
 * @param request - The incoming request
 * @param v1Path - The target v1 path, e.g. "/api/v1/wallets"
 * @returns 308 Permanent Redirect response
 *
 * @example
 * // In /api/wallets/route.ts (legacy):
 * export const GET = permanentRedirectToV1("/api/v1/wallets");
 * export const POST = permanentRedirectToV1("/api/v1/wallets");
 */
export function redirectToV1(v1Path: string) {
  return function handler(request: NextRequest) {
    const url = new URL(request.url);
    // Preserve query params
    const targetUrl = new URL(
      `${v1Path}${url.search}`,
      url.origin
    );
    return NextResponse.redirect(targetUrl, { status: 308 });
  };
}

/**
 * Creates redirect handlers for all standard HTTP methods.
 * Assign each to the named export in the route file.
 */
export function allMethodsRedirectToV1(v1Path: string) {
  const handler = redirectToV1(v1Path);
  return {
    GET: handler,
    POST: handler,
    PUT: handler,
    PATCH: handler,
    DELETE: handler,
  };
}
