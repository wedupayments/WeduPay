import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse } from "@/lib/api-response";
import { cookies } from "next/headers";

export interface AuthResult {
  userId: string | null;
  apiKeyId: string | null;
  authenticated: boolean;
  permissions: string[];
}

export async function authenticateRequest(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization");
  const apiKeyHeader = request.headers.get("X-API-Key");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    
    if (token) {
      const cookieStore = await cookies();
      const cookieUserId = cookieStore.get("wedupay-user-id")?.value;
      
      if (cookieUserId) {
        return {
          userId: cookieUserId,
          apiKeyId: null,
          authenticated: true,
          permissions: ["read", "write"],
        };
      }
    }
  }

  if (apiKeyHeader) {
    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { key: apiKeyHeader },
      });

      if (!apiKey) {
        return { userId: null, apiKeyId: null, authenticated: false, permissions: [] };
      }

      if (!apiKey.isActive) {
        return { userId: null, apiKeyId: null, authenticated: false, permissions: [] };
      }

      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return { userId: null, apiKeyId: null, authenticated: false, permissions: [] };
      }

      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });

      return {
        userId: apiKey.userId,
        apiKeyId: apiKey.id,
        authenticated: true,
        permissions: apiKey.permissions,
      };
    } catch {
      return { userId: null, apiKeyId: null, authenticated: false, permissions: [] };
    }
  }

  const cookieStore = await cookies();
  const cookieUserId = cookieStore.get("wedupay-user-id")?.value;

  if (cookieUserId) {
    return {
      userId: cookieUserId,
      apiKeyId: null,
      authenticated: true,
      permissions: ["read", "write"],
    };
  }

  return { userId: null, apiKeyId: null, authenticated: false, permissions: [] };
}

export function requireAuth(auth: AuthResult): NextResponse | null {
  if (!auth.authenticated) {
    const error = createErrorResponse("UNAUTHORIZED", "Authentication required", undefined, 401);
    return NextResponse.json(error.body, { status: error.status });
  }
  return null;
}

export function requirePermission(auth: AuthResult, permission: string): NextResponse | null {
  if (!auth.authenticated) {
    return requireAuth(auth);
  }

  if (!auth.permissions.includes(permission) && !auth.permissions.includes("*")) {
    const error = createErrorResponse(
      "FORBIDDEN",
      `Permission '${permission}' required`,
      undefined,
      403
    );
    return NextResponse.json(error.body, { status: error.status });
  }

  return null;
}
