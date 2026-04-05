/**
 * IP Allowlisting & Filtering
 *
 * Provides IP-based access control for:
 * - Webhook endpoints (payment provider IPs)
 * - Admin API routes
 * - Rate limiting bypass
 *
 * @module lib/ip-filter
 */

export interface IPFilterConfig {
  allowedIPs?: string[];
  allowedCIDRs?: string[];
  blockedIPs?: string[];
  blockedCIDRs?: string[];
}

export interface IPFilterResult {
  allowed: boolean;
  reason: string;
  ipInfo: {
    ip: string;
    isAllowed: boolean;
    isBlocked: boolean;
    country?: string;
  };
}

/**
 * Parse CIDR notation into IP range
 *
 * @param cidr - CIDR string (e.g., "192.168.1.0/24")
 * @returns Object with start and end IP as numbers
 */
function parseCIDR(cidr: string): { start: number; end: number } {
  const [ip, prefixStr] = cidr.split("/");
  const prefix = parseInt(prefixStr, 10);

  const ipParts = ip.split(".").map(Number);
  const ipNum =
    (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];

  const mask = prefix === 0 ? 0 : ~0 << (32 - prefix);
  const start = ipNum & mask;
  const end = start | ~mask;

  return { start: start >>> 0, end: end >>> 0 };
}

/**
 * Convert IP string to number for comparison
 *
 * @param ip - IPv4 address string
 * @returns IP as 32-bit unsigned integer
 */
function ipToNumber(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * Check if an IP is within a CIDR range
 *
 * @param ip - The IP address to check
 * @param cidr - The CIDR range (e.g., "192.168.1.0/24")
 * @returns True if IP is within the range
 */
export function isIPInCIDR(ip: string, cidr: string): boolean {
  try {
    const ipNum = ipToNumber(ip);
    const { start, end } = parseCIDR(cidr);
    return ipNum >= start && ipNum <= end;
  } catch {
    return false;
  }
}

/**
 * Known payment provider IP ranges
 * These should be updated periodically from provider documentation
 */
export const KNOWN_PROVIDER_IPS: Record<string, string[]> = {
  mpesa: [
    "196.216.0.0/14", // Safaricom Kenya
    "41.211.0.0/16",
  ],
  flutterwave: [
    "3.223.0.0/16", // AWS US East
    "52.206.0.0/16",
  ],
  paystack: [
    "52.31.0.0/16", // AWS EU West
  ],
  ecocash: [
    "196.46.0.0/16", // Econet Zimbabwe
  ],
  mtn: [
    "41.191.0.0/16", // MTN Nigeria
    "197.210.0.0/16",
  ],
};

/**
 * Check if an IP is from a known payment provider
 *
 * @param ip - The IP address to check
 * @param provider - Optional provider name to check against
 * @returns True if IP matches provider range
 */
export function isKnownProviderIP(ip: string, provider?: string): boolean {
  if (provider && KNOWN_PROVIDER_IPS[provider]) {
    return KNOWN_PROVIDER_IPS[provider].some((cidr) => isIPInCIDR(ip, cidr));
  }

  // Check all providers
  return Object.values(KNOWN_PROVIDER_IPS).some((cidrs) =>
    cidrs.some((cidr) => isIPInCIDR(ip, cidr))
  );
}

/**
 * Filter an IP against allowlist and blocklist
 *
 * @param ip - The IP address to check
 * @param config - Filter configuration
 * @returns IPFilterResult with allow/deny decision
 *
 * @example
 * ```typescript
 * const result = filterIP("192.168.1.100", {
 *   allowedIPs: ["192.168.1.0/24"],
 *   blockedIPs: ["10.0.0.5"],
 * });
 *
 * if (!result.allowed) {
 *   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 * }
 * ```
 */
export function filterIP(ip: string, config: IPFilterConfig): IPFilterResult {
  // Check blocklist first (deny overrides allow)
  if (config.blockedIPs?.includes(ip)) {
    return {
      allowed: false,
      reason: `IP ${ip} is blocked`,
      ipInfo: { ip, isAllowed: false, isBlocked: true },
    };
  }

  for (const cidr of config.blockedCIDRs ?? []) {
    if (isIPInCIDR(ip, cidr)) {
      return {
        allowed: false,
        reason: `IP ${ip} is in blocked CIDR range ${cidr}`,
        ipInfo: { ip, isAllowed: false, isBlocked: true },
      };
    }
  }

  // If no allowlist, allow by default (after blocklist check)
  if (!config.allowedIPs?.length && !config.allowedCIDRs?.length) {
    return {
      allowed: true,
      reason: "IP allowed (no restrictions)",
      ipInfo: { ip, isAllowed: true, isBlocked: false },
    };
  }

  // Check allowlist
  const isExplicitlyAllowed = config.allowedIPs?.includes(ip) ?? false;
  const isCIDRAllowed = config.allowedCIDRs?.some((cidr) => isIPInCIDR(ip, cidr)) ?? false;

  if (isExplicitlyAllowed || isCIDRAllowed) {
    return {
      allowed: true,
      reason: isExplicitlyAllowed ? "IP explicitly allowed" : "IP allowed by CIDR range",
      ipInfo: { ip, isAllowed: true, isBlocked: false },
    };
  }

  // Not in allowlist
  return {
    allowed: false,
    reason: `IP ${ip} not in allowed list`,
    ipInfo: { ip, isAllowed: false, isBlocked: false },
  };
}

/**
 * Extract client IP from request headers
 *
 * Handles common proxy/load balancer headers.
 *
 * @param headers - Request headers
 * @returns Client IP address or null
 */
export function extractClientIP(headers: Headers): string | null {
  // Check common headers in priority order
  const headerPriority = [
    "cf-connecting-ip", // Cloudflare
    "x-real-ip", // Nginx
    "x-forwarded-for", // Common proxy
    "x-client-ip", // Azure
    "true-client-ip", // Akamai
  ];

  for (const header of headerPriority) {
    const value = headers.get(header);
    if (value) {
      // x-forwarded-for may contain comma-separated list
      // First IP is the original client
      const firstIP = value.split(",")[0].trim();
      if (isValidIPv4(firstIP) || isValidIPv6(firstIP)) {
        return firstIP;
      }
    }
  }

  return null;
}

/**
 * Validate IPv4 address
 */
function isValidIPv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255 && part === num.toString();
  });
}

/**
 * Validate IPv6 address
 */
function isValidIPv6(ip: string): boolean {
  return ip.includes(":");
}
