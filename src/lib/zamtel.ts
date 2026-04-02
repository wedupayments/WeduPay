/**
 * Zamtel Money API Integration (Zambia)
 * Supports: Zambia
 */

export interface ZamtelConfig {
  apiKey: string;
  merchantCode: string;
  environment: "sandbox" | "live";
  currency: string;
}

export interface ZamtelPaymentRequest {
  phoneNumber: string;
  amount: number;
  reference: string;
  description: string;
  callbackUrl: string;
}

export interface ZamtelPaymentResponse {
  status: "SUCCESS" | "PENDING" | "FAILED";
  transactionId?: string;
  message?: string;
}

export interface ZamtelTransactionStatus {
  status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED";
  transactionId: string;
  amount?: number;
  currency?: string;
  phoneNumber?: string;
  transactionDate?: string;
}

export interface ZamtelRefundRequest {
  transactionId: string;
  amount: number;
  reason: string;
}

export interface ZamtelRefundResponse {
  status: string;
  refundId?: string;
  message?: string;
}

export class ZamtelAPI {
  private config: ZamtelConfig;

  constructor(config: ZamtelConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    return this.config.environment === "sandbox"
      ? "https://sandbox.zamtel.co.zm"
      : "https://api.zamtel.co.zm";
  }

  private formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");

    if (digits.startsWith("0")) {
      return `260${digits.slice(1)}`;
    }

    if (digits.startsWith("+")) {
      return digits.slice(1);
    }

    if (!digits.startsWith("260")) {
      return `260${digits}`;
    }

    return digits;
  }

  validatePhoneNumber(phone: string): boolean {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 9 && digits.length <= 12;
  }

  async initiatePayment(request: ZamtelPaymentRequest): Promise<ZamtelPaymentResponse> {
    try {
      const reference = request.reference || `ZAMTEL-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        merchant_code: this.config.merchantCode,
        amount: request.amount,
        currency: this.config.currency,
        customer_phone: this.formatPhoneNumber(request.phoneNumber),
        reference,
        description: request.description,
        callback_url: request.callbackUrl,
      };

      const response = await fetch(`${this.getBaseUrl()}/api/v1/payment`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
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
      console.error("Zamtel payment error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async getTransactionStatus(transactionId: string): Promise<ZamtelTransactionStatus> {
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
      console.error("Zamtel status error:", error);
      return {
        status: "FAILED",
        transactionId,
      };
    }
  }

  async refundPayment(request: ZamtelRefundRequest): Promise<ZamtelRefundResponse> {
    try {
      const payload = {
        transaction_id: request.transactionId,
        amount: request.amount,
        reason: request.reason,
      };

      const response = await fetch(`${this.getBaseUrl()}/api/v1/refund`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
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
      console.error("Zamtel refund error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
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

export const createZamtelAPI = (config: ZamtelConfig): ZamtelAPI => {
  return new ZamtelAPI(config);
};

export const zamtelAPI = new ZamtelAPI({
  apiKey: process.env.ZAMTEL_API_KEY || "",
  merchantCode: process.env.ZAMTEL_MERCHANT_CODE || "",
  environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
  currency: process.env.ZAMTEL_CURRENCY || "ZMW",
});
