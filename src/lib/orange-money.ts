/**
 * Orange Money API Integration
 * Supports: Senegal, Ivory Coast, Mali, Burkina Faso, Cameroon, Madagascar, Botswana, DRC
 * Documentation: https://developer.orange.com/apis/orange-money-web-payment
 */

export interface OrangeMoneyConfig {
  clientId: string;
  clientSecret: string;
  merchantKey: string;
  environment: "sandbox" | "live";
  countryCode: string;
  currency: string;
}

export interface OrangeMoneyPaymentRequest {
  phoneNumber: string;
  amount: number;
  reference: string;
  description: string;
  callbackUrl: string;
}

export interface OrangeMoneyPaymentResponse {
  status: "SUCCESS" | "PENDING" | "FAILED";
  paymentUrl?: string;
  sessionId?: string;
  message?: string;
}

export interface OrangeMoneyTransactionStatus {
  status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED";
  reference: string;
  amount?: number;
  currency?: string;
  phoneNumber?: string;
  transactionDate?: string;
}

export interface OrangeMoneyRefundRequest {
  transactionId: string;
  amount: number;
  reason: string;
}

export interface OrangeMoneyRefundResponse {
  status: string;
  refundId?: string;
  message?: string;
}

export class OrangeMoneyAPI {
  private config: OrangeMoneyConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: OrangeMoneyConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    return this.config.environment === "sandbox"
      ? "https://api.orange.com"
      : "https://api.orange.com";
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");

    const response = await fetch(`${this.getBaseUrl()}/oauth/v3/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error("Failed to get Orange Money access token");
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken as string;
  }

  private formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");

    // Remove leading zeros and add country code
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
    return digits.length >= 9 && digits.length <= 13;
  }

  async initiatePayment(request: OrangeMoneyPaymentRequest): Promise<OrangeMoneyPaymentResponse> {
    try {
      const token = await this.getAccessToken();
      const reference = request.reference || `OM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        merchant_key: this.config.merchantKey,
        order_id: reference,
        amount: request.amount.toFixed(2),
        currency: this.config.currency,
        customer_phone_number: this.formatPhoneNumber(request.phoneNumber),
        customer_name: request.description,
        return_url: request.callbackUrl,
        cancel_url: request.callbackUrl,
        notification_url: request.callbackUrl,
        lang: "fr",
      };

      const response = await fetch(`${this.getBaseUrl()}/orange-money-webpayment/${this.config.countryCode}/v1/webpayment-creation`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        return {
          status: "PENDING",
          paymentUrl: data.payment_url,
          sessionId: data.session_id,
          message: "Please complete payment on the redirected page",
        };
      }

      return {
        status: "FAILED",
        message: data.message || "Payment initiation failed",
      };
    } catch (error) {
      console.error("Orange Money payment error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async getTransactionStatus(reference: string): Promise<OrangeMoneyTransactionStatus> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${this.getBaseUrl()}/orange-money-webpayment/${this.config.countryCode}/v1/webpayment-status/${reference}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Accept": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          status: "FAILED",
          reference,
        };
      }

      const statusMap: Record<string, "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED"> = {
        "success": "SUCCESS",
        "pending": "PENDING",
        "failed": "FAILED",
        "cancelled": "CANCELLED",
      };

      return {
        status: statusMap[data.status] || "PENDING",
        reference,
        amount: parseFloat(data.amount) || undefined,
        currency: data.currency,
        phoneNumber: data.customer_phone_number,
        transactionDate: data.transaction_date,
      };
    } catch (error) {
      console.error("Orange Money status error:", error);
      return {
        status: "FAILED",
        reference,
      };
    }
  }

  async refundPayment(request: OrangeMoneyRefundRequest): Promise<OrangeMoneyRefundResponse> {
    try {
      const token = await this.getAccessToken();

      const payload = {
        transaction_id: request.transactionId,
        amount: request.amount.toFixed(2),
        reason: request.reason,
      };

      const response = await fetch(`${this.getBaseUrl()}/orange-money-refund/${this.config.countryCode}/v1/refund`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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
      console.error("Orange Money refund error:", error);
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
      CANCELLED: "Payment was cancelled by user",
      success: "Payment completed successfully",
      pending: "Payment is pending",
      failed: "Payment failed",
      cancelled: "Payment cancelled",
    };
    return descriptions[status] || `Unknown status (${status})`;
  }

  parseCallbackPayload(payload: Record<string, unknown>): {
    reference: string;
    status: string;
    amount?: number;
    currency?: string;
  } {
    return {
      reference: (payload.order_id as string) || "",
      status: (payload.status as string) || "UNKNOWN",
      amount: parseFloat(payload.amount as string) || undefined,
      currency: (payload.currency as string) || this.config.currency,
    };
  }
}

export const createOrangeMoneyAPI = (config: OrangeMoneyConfig): OrangeMoneyAPI => {
  return new OrangeMoneyAPI(config);
};

export const orangeMoneyAPI = new OrangeMoneyAPI({
  clientId: process.env.ORANGE_MONEY_CLIENT_ID || "",
  clientSecret: process.env.ORANGE_MONEY_CLIENT_SECRET || "",
  merchantKey: process.env.ORANGE_MONEY_MERCHANT_KEY || "",
  environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
  countryCode: process.env.ORANGE_MONEY_COUNTRY_CODE || "SN",
  currency: process.env.ORANGE_MONEY_CURRENCY || "XOF",
});
