/**
 * PalmPay API Integration (Nigeria, Ghana)
 * Supports: Nigeria, Ghana
 */

export interface PalmPayConfig {
  merchantId: string;
  apiKey: string;
  secretKey: string;
  environment: "sandbox" | "live";
  currency: string;
}

export interface PalmPayPaymentRequest {
  phoneNumber: string;
  amount: number;
  reference: string;
  description: string;
  callbackUrl: string;
}

export interface PalmPayPaymentResponse {
  status: "SUCCESS" | "PENDING" | "FAILED";
  transactionId?: string;
  message?: string;
}

export interface PalmPayTransactionStatus {
  status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED";
  transactionId: string;
  amount?: number;
  currency?: string;
  phoneNumber?: string;
  transactionDate?: string;
}

export interface PalmPayRefundRequest {
  transactionId: string;
  amount: number;
  reason: string;
}

export interface PalmPayRefundResponse {
  status: string;
  refundId?: string;
  message?: string;
}

export class PalmPayAPI {
  private config: PalmPayConfig;

  constructor(config: PalmPayConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    return this.config.environment === "sandbox"
      ? "https://sandboxapi.palmpay.com"
      : "https://api.palmpay.com";
  }

  private formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");

    if (digits.startsWith("0")) {
      return `234${digits.slice(1)}`;
    }

    if (digits.startsWith("+")) {
      return digits.slice(1);
    }

    if (!digits.startsWith("234")) {
      return `234${digits}`;
    }

    return digits;
  }

  validatePhoneNumber(phone: string): boolean {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 12;
  }

  async initiatePayment(request: PalmPayPaymentRequest): Promise<PalmPayPaymentResponse> {
    try {
      const reference = request.reference || `PALM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        merchant_id: this.config.merchantId,
        amount: request.amount,
        currency: this.config.currency,
        customer_phone: this.formatPhoneNumber(request.phoneNumber),
        reference,
        description: request.description,
        callback_url: request.callbackUrl,
      };

      const signature = this.generateSignature(payload, this.config.secretKey);

      const response = await fetch(`${this.getBaseUrl()}/api/v1/payment`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "X-Signature": signature,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          status: "PENDING",
          transactionId: data.transaction_id,
          message: "Payment initiated. Customer will receive USSD prompt.",
        };
      }

      return {
        status: "FAILED",
        message: data.message || "Payment initiation failed",
      };
    } catch (error) {
      console.error("PalmPay payment error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async getTransactionStatus(transactionId: string): Promise<PalmPayTransactionStatus> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/api/v1/transactions/${transactionId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${this.config.apiKey}`,
            "Accept": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          status: "FAILED",
          transactionId,
        };
      }

      const statusMap: Record<string, "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED"> = {
        "COMPLETED": "SUCCESS",
        "PENDING": "PENDING",
        "FAILED": "FAILED",
        "CANCELLED": "CANCELLED",
      };

      return {
        status: statusMap[data.status] || "PENDING",
        transactionId,
        amount: data.amount,
        currency: data.currency,
        phoneNumber: data.customer_phone,
        transactionDate: data.created_at,
      };
    } catch (error) {
      console.error("PalmPay status error:", error);
      return {
        status: "FAILED",
        transactionId,
      };
    }
  }

  async refundPayment(request: PalmPayRefundRequest): Promise<PalmPayRefundResponse> {
    try {
      const payload = {
        transaction_id: request.transactionId,
        amount: request.amount,
        reason: request.reason,
      };

      const signature = this.generateSignature(payload, this.config.secretKey);

      const response = await fetch(`${this.getBaseUrl()}/api/v1/refund`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "X-Signature": signature,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          status: "SUCCESS",
          refundId: data.refund_id,
          message: "Refund processed successfully",
        };
      }

      return {
        status: "FAILED",
        message: data.message || "Refund failed",
      };
    } catch (error) {
      console.error("PalmPay refund error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  private generateSignature(payload: Record<string, unknown>, secretKey: string): string {
    const sortedKeys = Object.keys(payload).sort();
    const sortedPayload = sortedKeys
      .map(key => `${key}=${payload[key]}`)
      .join("&");
    return Buffer.from(`${sortedPayload}${secretKey}`).toString("base64");
  }

  getStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
      SUCCESS: "Payment completed successfully",
      PENDING: "Payment is pending confirmation",
      FAILED: "Payment failed",
      CANCELLED: "Payment was cancelled",
      COMPLETED: "Payment completed",
    };
    return descriptions[status] || `Unknown status (${status})`;
  }
}

export const createPalmPayAPI = (config: PalmPayConfig): PalmPayAPI => {
  return new PalmPayAPI(config);
};

export const palmPayAPI = new PalmPayAPI({
  merchantId: process.env.PALMPAY_MERCHANT_ID || "",
  apiKey: process.env.PALMPAY_API_KEY || "",
  secretKey: process.env.PALMPAY_SECRET_KEY || "",
  environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
  currency: process.env.PALMPAY_CURRENCY || "NGN",
});
