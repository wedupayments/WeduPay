import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse } from "@/lib/api-response";

export interface QueryParamValidation {
  valid: boolean;
  duplicateParams: string[];
  error?: string;
}

export function validateQueryParams(url: URL): QueryParamValidation {
  const paramCounts = new Map<string, number>();

  for (const [key, value] of url.searchParams.entries()) {
    const count = paramCounts.get(key) || 0;
    paramCounts.set(key, count + 1);
  }

  const duplicates: string[] = [];
  for (const [key, count] of paramCounts.entries()) {
    if (count > 1) {
      duplicates.push(key);
    }
  }

  if (duplicates.length > 0) {
    return {
      valid: false,
      duplicateParams: duplicates,
      error: `Duplicate query parameters: ${duplicates.join(", ")}`,
    };
  }

  return { valid: true, duplicateParams: [] };
}

export function requireQueryParamValidation(request: Request): NextResponse | null {
  const url = new URL(request.url);
  const validation = validateQueryParams(url);

  if (!validation.valid) {
    const error = createErrorResponse(
      "INVALID_QUERY_PARAMS",
      validation.error || "Invalid query parameters",
      validation.duplicateParams.map((p) => ({
        code: "DUPLICATE_PARAM",
        target: p,
        message: `Parameter '${p}' appears multiple times in query string`,
      })),
      400
    );
    return NextResponse.json(error.body, { status: error.status });
  }

  return null;
}
