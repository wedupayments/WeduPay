/**
 * M-Pesa Tanzania API Integration (Vodacom Tanzania)
 * Supports: Tanzania
 * Documentation: https://developer.vodacom.co.tz/
 */

export interface MpesaTanzaniaConfig {
  apiKey: string;
  securityToken: string;
  shortCode: string;
  environment: "sandbox" | "live";
  currency: string;
}

export interface MpesaTanzaniaPaymentRequest {
  phoneNumber: string;
  amount: number;
  reference: string;
  description: string;
  callbackUrl: string;
}

export interface MpesaTanzaniaPaymentResponse {
  status: "SUCCESS" | "PENDING" | "FAILED";
  transactionId?: string;
  conversationId?: string;
  message?: string;
}

export interface MpesaTanzaniaTransactionStatus {
  status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED";
  transactionId: string;
  amount?: number;
  currency?: string;
  phoneNumber?: string;
  transactionDate?: string;
}

export interface MpesaTanzaniaRefundRequest {
  transactionId: string;
  amount: number;
  reason: string;
}

export interface MpesaTanzaniaRefundResponse {
  status: string;
  refundId?: string;
  message?: string;
}

export class MpesaTanzaniaAPI {
  private config: MpesaTanzaniaConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: MpesaTanzaniaConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    return this.config.environment === "sandbox"
      ? "https://mpesa-vodacom.azurewebsites.net"
      : "https://mpesa-vodacom.co.tz";
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch(`${this.getBaseUrl()}/token`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${this.config.apiKey}:${this.config.securityToken}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error("Failed to get M-Pesa Tanzania access token");
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken as string;
  }

  private formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");

    if (digits.startsWith("0")) {
      return `255${digits.slice(1)}`;
    }

    if (digits.startsWith("+")) {
      return digits.slice(1);
    }

    if (!digits.startsWith("255")) {
      return `255${digits}`;
    }

    return digits;
  }

  validatePhoneNumber(phone: string): boolean {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 9 && digits.length <= 12;
  }

  async initiatePayment(request: MpesaTanzaniaPaymentRequest): Promise<MpesaTanzaniaPaymentResponse> {
    try {
      const token = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 14);
      const password = Buffer.from(`${this.config.shortCode}${this.config.securityToken}${timestamp}`).toString("base64");

      const payload = {
        BusinessShortCode: this.config.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(request.amount),
        PartyA: this.formatPhoneNumber(request.phoneNumber),
        PartyB: this.config.shortCode,
        PhoneNumber: this.formatPhoneNumber(request.phoneNumber),
        CallBackURL: request.callbackUrl,
        AccountReference: request.reference,
        TransactionDesc: request.description,
      };

      const response = await fetch(`${this.getBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.ResponseCode === "0") {
        return {
          status: "PENDING",
          transactionId: data.CheckoutRequestID,
          conversationId: data.MerchantRequestID,
          message: data.CustomerMessage || "STK push sent. Please check your phone.",
        };
      }

      return {
        status: "FAILED",
        message: data.ResponseDescription || "Payment initiation failed",
      };
    } catch (error) {
      console.error("M-Pesa Tanzania payment error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async getTransactionStatus(checkoutRequestId: string): Promise<MpesaTanzaniaTransactionStatus> {
    try {
      const token = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 14);
      const password = Buffer.from(`${this.config.shortCode}${this.config.securityToken}${timestamp}`).toString("base64");

      const payload = {
        BusinessShortCode: this.config.shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await fetch(`${this.getBaseUrl()}/mpesa/stkpush/v1/queryrequest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.ResponseCode !== "0") {
        return {
          status: "FAILED",
          transactionId: checkoutRequestId,
        };
      }

      const statusMap: Record<string, "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED"> = {
        "0": "SUCCESS",
        "1": "PENDING",
      };

      return {
        status: statusMap[data.ResponseCode] || "PENDING",
        transactionId: checkoutRequestId,
        amount: data.Amount ? parseFloat(data.Amount) : undefined,
        currency: this.config.currency,
        phoneNumber: data.PhoneNumber,
        transactionDate: data.TransactionCompletedReceiveTime,
      };
    } catch (error) {
      console.error("M-Pesa Tanzania status error:", error);
      return {
        status: "FAILED",
        transactionId: checkoutRequestId,
      };
    }
  }

  async refundPayment(request: MpesaTanzaniaRefundRequest): Promise<MpesaTanzaniaRefundResponse> {
    try {
      const token = await this.getAccessToken();

      const payload = {
        CommandID: "TransactionReversal",
        Amount: Math.round(request.amount),
        ReceiverParty: "600000",
        RecieverIdentifierType: "11",
        Remarks: request.reason,
        Occasion: request.reason,
      };

      const response = await fetch(`${this.getBaseUrl()}/mpesa/reversal/v1/request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.ResponseCode === "0") {
        return {
          status: "SUCCESS",
          refundId: data.ConversationID,
          message: "Refund processed successfully",
        };
      }

      return {
        status: "FAILED",
        message: data.ResponseDescription || "Refund failed",
      };
    } catch (error) {
      console.error("M-Pesa Tanzania refund error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  getStatusDescription(responseCode: string): string {
    const descriptions: Record<string, string> = {
      "0": "Success",
      "1": "Insufficient balance",
      "2": "Less than minimum transaction value",
      "3": "Exceeds daily transfer limit",
      "4": "Would exceed recipient limit",
      "5": "Unresolved primary party",
      "6": "Unresolved receiver party",
      "999999": "Internal error",
    };
    return descriptions[responseCode] || `Unknown error (${responseCode})`;
  }
}

export const createMpesaTanzaniaAPI = (config: MpesaTanzaniaConfig): MpesaTanzaniaAPI => {
  return new MpesaTanzaniaAPI(config);
};

export const mpesaTanzaniaAPI = new MpesaTanzaniaAPI({
  apiKey: process.env.MPESA_TZ_API_KEY || "",
  securityToken: process.env.MPESA_TZ_SECURITY_TOKEN || "",
  shortCode: process.env.MPESA_TZ_SHORT_CODE || "",
  environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
  currency: process.env.MPESA_TZ_CURRENCY || "TZS",
});
