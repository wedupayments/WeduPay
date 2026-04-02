/**
 * Wave Mobile Money API Integration
 * Supports: Senegal, Ivory Coast, Mali, Burkina Faso
 * Documentation: https://business.wave.com/
 */

export interface WaveConfig {
  apiKey: string;
  secretKey: string;
  environment: "sandbox" | "live";
  countryCode: string;
  currency: string;
}

export interface WavePaymentRequest {
  phoneNumber: string;
  amount: number;
  reference: string;
  description: string;
  callbackUrl: string;
}

export interface WavePaymentResponse {
  status: "SUCCESS" | "PENDING" | "FAILED";
  transactionId?: string;
  message?: string;
  qrCode?: string;
}

export interface WaveTransactionStatus {
  status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED";
  transactionId: string;
  amount?: number;
  currency?: string;
  phoneNumber?: string;
  transactionDate?: string;
}

export interface WaveRefundRequest {
  transactionId: string;
  amount: number;
  reason: string;
}

export interface WaveRefundResponse {
  status: string;
  refundId?: string;
  message?: string;
}

export class WaveAPI {
  private config: WaveConfig;

  constructor(config: WaveConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    return this.config.environment === "sandbox"
      ? "https://api-sandbox.wave.com"
      : "https://api.wave.com";
  }

  private formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");

    if (digits.startsWith("0")) {
      return `${this.config.countryCode}${digits.slice(1)}`;
    }

    if (digits.startsWith("+")) {
      return digits.slice(1);
    }

    return digits;
  }

  validatePhoneNumber(phone: string): boolean {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 12;
  }

  async initiatePayment(request: WavePaymentRequest): Promise<WavePaymentResponse> {
    try {
      const reference = request.reference || `WAVE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        amount: Math.round(request.amount),
        currency: this.config.currency,
        reference,
        description: request.description,
        customer: {
          phone: this.formatPhoneNumber(request.phoneNumber),
        },
        callback_url: request.callbackUrl,
      };

      const response = await fetch(`${this.getBaseUrl()}/v1/payments`, {
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
          transactionId: data.id,
          message: "Payment initiated. Customer will receive USSD prompt.",
          qrCode: data.qr_code,
        };
      }

      return {
        status: "FAILED",
        message: data.message || data.error?.message || "Payment initiation failed",
      };
    } catch (error) {
      console.error("Wave payment error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async getTransactionStatus(transactionId: string): Promise<WaveTransactionStatus> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/v1/payments/${transactionId}`,
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
        "succeeded": "SUCCESS",
        "pending": "PENDING",
        "failed": "FAILED",
        "cancelled": "CANCELLED",
      };

      return {
        status: statusMap[data.status] || "PENDING",
        transactionId,
        amount: data.amount ? data.amount / 100 : undefined,
        currency: data.currency,
        phoneNumber: data.customer?.phone,
        transactionDate: data.created_at,
      };
    } catch (error) {
      console.error("Wave status error:", error);
      return {
        status: "FAILED",
        transactionId,
      };
    }
  }

  async refundPayment(request: WaveRefundRequest): Promise<WaveRefundResponse> {
    try {
      const payload = {
        payment_id: request.transactionId,
        amount: Math.round(request.amount),
        reason: request.reason,
      };

      const response = await fetch(`${this.getBaseUrl()}/v1/refunds`, {
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
          refundId: data.id,
          message: "Refund processed successfully",
        };
      }

      return {
        status: "FAILED",
        message: data.message || data.error?.message || "Refund failed",
      };
    } catch (error) {
      console.error("Wave refund error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async createQRCode(amount: number, reference: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/v1/qr-codes`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount),
          currency: this.config.currency,
          reference,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return data.qr_code_url || null;
      }

      return null;
    } catch (error) {
      console.error("Wave QR code error:", error);
      return null;
    }
  }

  getStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
      SUCCESS: "Payment completed successfully",
      PENDING: "Payment is pending confirmation",
      FAILED: "Payment failed",
      CANCELLED: "Payment was cancelled",
      succeeded: "Payment succeeded",
      pending: "Payment pending",
      failed: "Payment failed",
      cancelled: "Payment cancelled",
    };
    return descriptions[status] || `Unknown status (${status})`;
  }
}

export const createWaveAPI = (config: WaveConfig): WaveAPI => {
  return new WaveAPI(config);
};

export const waveAPI = new WaveAPI({
  apiKey: process.env.WAVE_API_KEY || "",
  secretKey: process.env.WAVE_SECRET_KEY || "",
  environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
  countryCode: process.env.WAVE_COUNTRY_CODE || "SN",
  currency: process.env.WAVE_CURRENCY || "XOF",
});
