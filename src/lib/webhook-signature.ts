import { createHmac, timingSafeEqual } from "crypto";

export interface WebhookSignature {
  valid: boolean;
  provider: string;
  timestamp?: string;
  error?: string;
}

export function verifyMpesaSignature(
  payload: string,
  signature: string,
  callbackUrl: string
): WebhookSignature {
  const expectedSignature = createHmac("sha256", process.env.MPESA_SHORTCODE || "")
    .update(payload)
    .digest("base64");

  try {
    const isValid = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    return {
      valid: isValid,
      provider: "M-Pesa",
    };
  } catch {
    return {
      valid: false,
      provider: "M-Pesa",
      error: "Signature verification failed",
    };
  }
}

export function verifyEcocashSignature(
  payload: string,
  signature: string
): WebhookSignature {
  const secret = process.env.ECOCASH_WEBHOOK_SECRET || "";
  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    const isValid = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    return {
      valid: isValid,
      provider: "EcoCash",
    };
  } catch {
    return {
      valid: false,
      provider: "EcoCash",
      error: "Signature verification failed",
    };
  }
}

export function verifyMtnSignature(
  payload: string,
  signature: string,
  subscriptionKey: string
): WebhookSignature {
  const expectedSignature = createHmac("sha256", subscriptionKey)
    .update(payload)
    .digest("base64");

  try {
    const isValid = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    return {
      valid: isValid,
      provider: "MTN",
    };
  } catch {
    return {
      valid: false,
      provider: "MTN",
      error: "Signature verification failed",
    };
  }
}

export function verifyWebhookSignature(
  provider: "mpesa" | "ecocash" | "mtn",
  payload: string,
  signature: string,
  metadata?: { callbackUrl?: string; subscriptionKey?: string }
): WebhookSignature {
  switch (provider) {
    case "mpesa":
      return verifyMpesaSignature(payload, signature, metadata?.callbackUrl || "");
    case "ecocash":
      return verifyEcocashSignature(payload, signature);
    case "mtn":
      return verifyMtnSignature(payload, signature, metadata?.subscriptionKey || "");
    default:
      return {
        valid: false,
        provider: "unknown",
        error: `Unknown provider: ${provider}`,
      };
  }
}

export function generateWebhookSignature(
  provider: "mpesa" | "ecocash" | "mtn",
  payload: string,
  secret: string
): string {
  return createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}
