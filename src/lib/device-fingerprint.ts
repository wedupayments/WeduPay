/**
 * Device Fingerprinting
 *
 * Generates a unique device fingerprint from request headers
 * using Web Crypto API (Edge Runtime compatible).
 *
 * @module lib/device-fingerprint
 */

export interface DeviceFingerprintInput {
  userAgent?: string | null;
  acceptLanguage?: string | null;
  acceptEncoding?: string | null;
  platform?: string | null;
  clientIP?: string | null;
  screenResolution?: string | null;
  timezone?: string | null;
}

export interface DeviceFingerprintResult {
  fingerprint: string;
  confidence: "low" | "medium" | "high";
  metadata: Record<string, string>;
}

/**
 * Generate SHA-256 hash using Web Crypto API (Edge compatible)
 */
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a device fingerprint from request metadata
 */
export async function generateDeviceFingerprint(
  input: DeviceFingerprintInput
): Promise<DeviceFingerprintResult> {
  const components: string[] = [];
  const metadata: Record<string, string> = {};

  if (input.userAgent) {
    components.push(`ua:${input.userAgent}`);
    metadata.userAgent = truncate(input.userAgent, 200);
  }
  if (input.acceptLanguage) {
    components.push(`lang:${input.acceptLanguage}`);
    metadata.acceptLanguage = input.acceptLanguage;
  }
  if (input.acceptEncoding) {
    components.push(`enc:${input.acceptEncoding}`);
  }
  if (input.platform) {
    components.push(`plat:${input.platform}`);
    metadata.platform = input.platform;
  }
  if (input.clientIP) {
    const maskedIP = maskIP(input.clientIP);
    components.push(`ip:${maskedIP}`);
    metadata.clientIPMasked = maskedIP;
  }
  if (input.screenResolution) {
    components.push(`screen:${input.screenResolution}`);
    metadata.screenResolution = input.screenResolution;
  }
  if (input.timezone) {
    components.push(`tz:${input.timezone}`);
    metadata.timezone = input.timezone;
  }

  const fingerprint = await sha256(components.join("|"));
  const confidence = calculateConfidence(components.length);

  return { fingerprint, confidence, metadata };
}

function maskIP(ip: string): string {
  if (ip.includes(".")) {
    const parts = ip.split(".");
    parts[parts.length - 1] = "xxx";
    return parts.join(".");
  }
  if (ip.includes(":")) {
    const parts = ip.split(":");
    parts[parts.length - 1] = "xxxx";
    return parts.join(":");
  }
  return "unknown";
}

function calculateConfidence(componentCount: number): "low" | "medium" | "high" {
  if (componentCount >= 5) return "high";
  if (componentCount >= 3) return "medium";
  return "low";
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}

export function extractFingerprintFromHeaders(
  headers: Headers
): DeviceFingerprintInput {
  return {
    userAgent: headers.get("user-agent"),
    acceptLanguage: headers.get("accept-language"),
    acceptEncoding: headers.get("accept-encoding"),
    platform: headers.get("sec-ch-ua-platform"),
    clientIP:
      headers.get("x-forwarded-for")?.split(",")[0] ??
      headers.get("x-real-ip") ??
      null,
    screenResolution: headers.get("sec-ch-viewport-width")
      ? `${headers.get("sec-ch-viewport-width")}x${headers.get("sec-ch-viewport-height")}`
      : null,
    timezone: headers.get("sec-ch-timezone") ?? null,
  };
}

export function compareFingerprints(
  storedFingerprint: string,
  currentFingerprint: string
): { matches: boolean; confidence: number } {
  if (storedFingerprint === currentFingerprint) {
    return { matches: true, confidence: 100 };
  }
  return { matches: false, confidence: 0 };
}
