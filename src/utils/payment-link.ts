import { CreatePaymentLinkInput } from "@/services/payment-link.service";

export class PaymentLinkParser {
  static parse(data: any): Partial<CreatePaymentLinkInput> {
    const errors: string[] = [];

    if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
      errors.push("Valid amount is required");
    }

    if (!data.currency || typeof data.currency !== "string" || data.currency.length !== 3) {
      errors.push("Valid 3-character currency code is required");
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    return {
      amount: Number(data.amount),
      currency: data.currency.toUpperCase(),
      description: data.description || undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      usageLimit: data.usageLimit ? parseInt(data.usageLimit) : undefined,
      metadata: data.metadata || {},
    };
  }

  static validate(data: any): boolean {
    try {
      this.parse(data);
      return true;
    } catch {
      return false;
    }
  }
}

export class PaymentLinkFormatter {
  static formatUrl(linkId: string, baseUrl: string = ""): string {
    if (!baseUrl && typeof window !== "undefined") {
      baseUrl = window.location.origin;
    }
    return `${baseUrl}/pay/${linkId}`;
  }

  static formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  }

  static encodeMetadata(metadata: any): string {
    return Buffer.from(JSON.stringify(metadata)).toString("base64url");
  }

  static decodeMetadata(encoded: string): any {
    try {
      return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    } catch {
      return {};
    }
  }
}
