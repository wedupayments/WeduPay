/**
 * API utilities barrel
 *
 * Centralises API response helpers, middleware, CORS, and rate-limiting.
 * Import from here rather than the individual lib files.
 */

export type {
  ApiResponse,
  ErrorResponse,
  ResourceResponse,
} from "@/lib/api-response";
export {
  buildUrl,
  createApiResponse,
  createResourceResponse,
  createErrorResponse,
  buildLinkHeader,
  getCacheHeaders,
  RESPONSE_HEADERS,
} from "@/lib/api-response";
