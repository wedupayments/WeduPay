import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createErrorResponse } from "@/lib/api-response";
import { cookies } from "next/headers";
import { getSession } from "@/lib/supabase-server";
import { ensureTenantMembership, resolveTenantContext } from "@/lib/tenant";

export interface AuthResult {
  userId: string | null;
  apiKeyId: string | null;
  authenticated: boolean;
  permissions: string[];
  email: string | null;
  role: string | null;
  supabaseUserId: string | null;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  tenantRole: string | null;
}

const UNAUTHENTICATED_RESULT: AuthResult = {
  userId: null,
  apiKeyId: null,
  authenticated: false,
  permissions: [],
  email: null,
  role: null,
  supabaseUserId: null,
  tenantId: null,
  tenantSlug: null,
  tenantName: null,
  tenantRole: null,
};

function getPermissionsForRole(role: string | null): string[] {
  if (role === "ADMIN") {
    return ["*"];
  }

  if (role === "MERCHANT") {
    return ["read", "write", "payments:manage", "transfers:manage"];
  }

  return ["read", "write"];
}

async function backfillTenantOwnership(userId: string, tenantId: string) {
  await Promise.all([
    prisma.wallet.updateMany({ where: { userId, tenantId: null }, data: { tenantId } }),
    prisma.transaction.updateMany({ where: { userId, tenantId: null }, data: { tenantId } }),
    prisma.paymentReference.updateMany({ where: { userId, tenantId: null }, data: { tenantId } }),
    prisma.virtualCard.updateMany({ where: { userId, tenantId: null }, data: { tenantId } }),
    prisma.apiKey.updateMany({ where: { userId, tenantId: null }, data: { tenantId } }),
    prisma.p2PTransfer.updateMany({ where: { userId, tenantId: null }, data: { tenantId } }),
    prisma.transferRecipient.updateMany({ where: { userId, tenantId: null }, data: { tenantId } }),
    prisma.complianceCheck.updateMany({ where: { userId, tenantId: null }, data: { tenantId } }),
  ]);
}

async function authenticateSupabaseToken(token: string, request: Request): Promise<AuthResult> {
  const supabaseUser = await getSession(token);
  if (!supabaseUser) {
    return UNAUTHENTICATED_RESULT;
  }

  const normalizedEmail = supabaseUser.email?.trim().toLowerCase() ?? null;
  const appUser = await prisma.user.findFirst({
    where: {
      OR: [
        { supabaseUserId: supabaseUser.id },
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ],
    },
  });

  const cookieStore = await cookies();
  const tenantContext = await resolveTenantContext({
    pathname: new URL(request.url).pathname,
    hostname: new URL(request.url).hostname,
    searchParams: new URL(request.url).searchParams,
    tenantCookie: cookieStore.get("wedupay-tenant")?.value ?? null,
  });

  if (appUser && !appUser.supabaseUserId) {
    await prisma.user.update({
      where: { id: appUser.id },
      data: { supabaseUserId: supabaseUser.id },
    });
  }

  let membership = null;

  if (appUser && tenantContext.tenantId) {
    membership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenantContext.tenantId,
          userId: appUser.id,
        },
      },
    });

    if (!membership) {
      membership = await ensureTenantMembership({
        tenantId: tenantContext.tenantId,
        userId: appUser.id,
        role: appUser.role,
      });
    }

    await backfillTenantOwnership(appUser.id, tenantContext.tenantId);
  }

  const effectiveRole = membership?.role || appUser?.role || null;

  return {
    userId: appUser?.id ?? null,
    apiKeyId: null,
    authenticated: true,
    permissions: getPermissionsForRole(effectiveRole),
    email: normalizedEmail,
    role: effectiveRole,
    supabaseUserId: supabaseUser.id,
    tenantId: tenantContext.tenantId,
    tenantSlug: tenantContext.tenantSlug,
    tenantName: tenantContext.tenantName,
    tenantRole: membership?.role || null,
  };
}

export async function authenticateRequest(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization");
  const apiKeyHeader = request.headers.get("X-API-Key");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      return authenticateSupabaseToken(token, request);
    }
  }

  if (apiKeyHeader) {
    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { key: apiKeyHeader },
      });

      if (!apiKey) {
        return UNAUTHENTICATED_RESULT;
      }

      if (!apiKey.isActive) {
        return UNAUTHENTICATED_RESULT;
      }

      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return UNAUTHENTICATED_RESULT;
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
        email: null,
        role: null,
        supabaseUserId: null,
        tenantId: apiKey.tenantId,
        tenantSlug: null,
        tenantName: null,
        tenantRole: null,
      };
    } catch {
      return UNAUTHENTICATED_RESULT;
    }
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  console.log('[Auth] Checking cookies - accessToken:', accessToken ? 'present' : 'missing');

  if (accessToken) {
    return authenticateSupabaseToken(accessToken, request);
  }

  return UNAUTHENTICATED_RESULT;
}

export function requireAuth(auth: AuthResult): NextResponse | null {
  if (!auth.authenticated) {
    const error = createErrorResponse("UNAUTHORIZED", "Authentication required", undefined, 401);
    return NextResponse.json(error.body, { status: error.status });
  }
  return null;
}

export function requireAppUser(auth: AuthResult): NextResponse | null {
  if (!auth.authenticated) {
    return requireAuth(auth);
  }

  if (!auth.userId) {
    const error = createErrorResponse(
      "PROFILE_REQUIRED",
      "A WeduPay profile is required for this action",
      undefined,
      403
    );
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

export function requireTenantAccess(auth: AuthResult): NextResponse | null {
  if (!auth.authenticated) {
    return requireAuth(auth);
  }

  if (!auth.tenantId) {
    const error = createErrorResponse(
      "TENANT_REQUIRED",
      "A tenant context is required for this action",
      undefined,
      403
    );
    return NextResponse.json(error.body, { status: error.status });
  }

  return null;
}
