import { prisma } from "@/lib/prisma";

const DEFAULT_TENANT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || "wedupay";
const PLATFORM_HOSTS = new Set(["localhost", "127.0.0.1", "wedu-pay.vercel.app", "www.wedu-pay.vercel.app"]);
const RESERVED_SUBDOMAINS = new Set(["www", "app"]);

export interface TenantContext {
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  resolvedBy: "path" | "query" | "host" | "domain" | "cookie" | "default" | "none";
}

function stripPort(hostname: string): string {
  return hostname.split(":")[0].trim().toLowerCase();
}

export function normalizeTenantSlug(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return normalized || null;
}

export function extractTenantSlugFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/t\/([^/]+)(?:\/|$)/i);
  return normalizeTenantSlug(match?.[1] ?? null);
}

export function stripTenantPrefix(pathname: string): string {
  const stripped = pathname.replace(/^\/t\/[^/]+(?=\/|$)/i, "");
  return stripped || "/";
}

export function buildTenantPath(pathname: string, tenantSlug?: string | null): string {
  if (!tenantSlug) {
    return pathname;
  }

  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `/t/${tenantSlug}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export function extractTenantSlugFromHost(hostname: string): string | null {
  const normalizedHost = stripPort(hostname);

  if (PLATFORM_HOSTS.has(normalizedHost)) {
    return null;
  }

  const rootDomain = stripPort(new URL(process.env.NEXT_PUBLIC_APP_URL || "https://wedu-pay.vercel.app").hostname);
  if (normalizedHost.endsWith(`.${rootDomain}`)) {
    const subdomain = normalizedHost.slice(0, -(rootDomain.length + 1));
    if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) {
      return null;
    }

    return normalizeTenantSlug(subdomain);
  }

  return null;
}

export async function ensureTenant(slug: string, name?: string) {
  const normalizedSlug = normalizeTenantSlug(slug) ?? DEFAULT_TENANT_SLUG;

  return prisma.tenant.upsert({
    where: { slug: normalizedSlug },
    update: {},
    create: {
      slug: normalizedSlug,
      name: name || normalizedSlug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    },
  });
}

export async function ensureTenantMembership(params: {
  userId: string;
  tenantId: string;
  role: string;
}) {
  const existing = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_userId: {
        tenantId: params.tenantId,
        userId: params.userId,
      },
    },
  });

  if (existing) {
    return existing;
  }

  const membershipCount = await prisma.tenantMembership.count({
    where: { userId: params.userId },
  });

  return prisma.tenantMembership.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      role: params.role,
      isDefault: membershipCount === 0,
      status: "ACTIVE",
    },
  });
}

export async function resolveTenantContext(params: {
  pathname: string;
  hostname: string;
  searchParams?: URLSearchParams;
  tenantCookie?: string | null;
}): Promise<TenantContext> {
  const pathSlug = extractTenantSlugFromPathname(params.pathname);
  const querySlug = normalizeTenantSlug(params.searchParams?.get("tenant"));
  const hostSlug = extractTenantSlugFromHost(params.hostname);
  const cookieSlug = normalizeTenantSlug(params.tenantCookie);

  if (pathSlug) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: pathSlug } });
    if (tenant) {
      return { tenantId: tenant.id, tenantSlug: tenant.slug, tenantName: tenant.name, resolvedBy: "path" };
    }
  }

  if (querySlug) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: querySlug } });
    if (tenant) {
      return { tenantId: tenant.id, tenantSlug: tenant.slug, tenantName: tenant.name, resolvedBy: "query" };
    }
  }

  if (hostSlug) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: hostSlug } });
    if (tenant) {
      return { tenantId: tenant.id, tenantSlug: tenant.slug, tenantName: tenant.name, resolvedBy: "host" };
    }
  }

  const normalizedHost = stripPort(params.hostname);
  if (!PLATFORM_HOSTS.has(normalizedHost)) {
    const domainTenant = await prisma.tenantDomain.findUnique({
      where: { domain: normalizedHost },
      include: { tenant: true },
    });
    if (domainTenant) {
      return {
        tenantId: domainTenant.tenant.id,
        tenantSlug: domainTenant.tenant.slug,
        tenantName: domainTenant.tenant.name,
        resolvedBy: "domain",
      };
    }
  }

  if (cookieSlug) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: cookieSlug } });
    if (tenant) {
      return { tenantId: tenant.id, tenantSlug: tenant.slug, tenantName: tenant.name, resolvedBy: "cookie" };
    }
  }

  const defaultTenant = await ensureTenant(DEFAULT_TENANT_SLUG, "WeduPay");
  return {
    tenantId: defaultTenant.id,
    tenantSlug: defaultTenant.slug,
    tenantName: defaultTenant.name,
    resolvedBy: "default",
  };
}
