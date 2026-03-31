export interface AirtelConfig {
  apiKey: string;
  merchantCode: string;
  environment: "sandbox" | "live";
  countryCode: string;
  currency: string;
}

export interface AirtelPaymentRequest {
  phoneNumber: string;
  amount: number;
  reference: string;
  description: string;
  callbackUrl?: string;
}

export interface AirtelPaymentResponse {
  status: "SUCCESS" | "PENDING" | "FAILED";
  referenceId?: string;
  message?: string;
  transactionId?: string;
}

export interface AirtelTransactionStatus {
  status: "SUCCESS" | "PENDING" | "FAILED";
  referenceId: string;
  amount?: number;
  currency?: string;
  phoneNumber?: string;
  transactionId?: string;
  timestamp?: string;
}

export interface AirtelRefundRequest {
  transactionId: string;
  amount: number;
  reference: string;
}

export interface AirtelRefundResponse {
  status: string;
  refundId?: string;
  message?: string;
}

export class AirtelAPI {
  private config: AirtelConfig;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: AirtelConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    return this.config.environment === "sandbox"
      ? "https://openapiuat.airtel.africa"
      : "https://openapi.airtel.africa";
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const response = await fetch(`${this.getBaseUrl()}/auth/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Country": this.config.countryCode,
        "X-Currency": this.config.currency,
      },
      body: `grant_type=client_credentials&client_id=${this.config.apiKey}&client_secret=${this.config.merchantCode}`,
    });

    if (!response.ok) {
      throw new Error("Failed to get Airtel token");
    }

    const data = await response.json();
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.token as string;
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
    return digits.length >= 9 && digits.length <= 12;
  }

  async initiatePayment(request: AirtelPaymentRequest): Promise<AirtelPaymentResponse> {
    try {
      const token = await this.getAccessToken();
      const referenceId = `AIRTEL-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        reference_id: referenceId,
        subscriber: {
          country: this.config.countryCode,
          currency: this.config.currency,
          msisdn: this.formatPhoneNumber(request.phoneNumber),
        },
        transaction: {
          amount: request.amount.toFixed(2),
          country: this.config.countryCode,
          currency: this.config.currency,
          id: referenceId,
        },
        narration: request.description,
      };

      const response = await fetch(`${this.getBaseUrl()}/merchant/v1/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Country": this.config.countryCode,
          "X-Currency": this.config.currency,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status?.code === "200") {
        return {
          status: "PENDING",
          referenceId,
          message: "Payment request accepted. Please check your phone to confirm.",
          transactionId: data.data?.transaction?.id,
        };
      }

      return {
        status: "FAILED",
        message: data.status?.message || "Payment initiation failed",
      };
    } catch (error) {
      console.error("Airtel payment error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async getTransactionStatus(referenceId: string): Promise<AirtelTransactionStatus> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${this.getBaseUrl()}/merchant/v1/payments/${referenceId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Country": this.config.countryCode,
            "X-Currency": this.config.currency,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          status: "FAILED",
          referenceId,
        };
      }

      const statusMap: Record<string, "SUCCESS" | "PENDING" | "FAILED"> = {
        "TS": "SUCCESS",
        "PD": "PENDING",
        "FL": "FAILED",
      };

      return {
        status: statusMap[data.data?.status?.status ?? ""] || "PENDING",
        referenceId,
        amount: parseFloat(data.data?.transaction?.amount) || undefined,
        currency: data.data?.transaction?.currency,
        phoneNumber: data.data?.subscriber?.msisdn,
        transactionId: data.data?.transaction?.id,
        timestamp: data.data?.status?.timestamp,
      };
    } catch (error) {
      console.error("Airtel status check error:", error);
      return {
        status: "FAILED",
        referenceId,
      };
    }
  }

  async requestRefund(request: AirtelRefundRequest): Promise<AirtelRefundResponse> {
    try {
      const token = await this.getAccessToken();

      const payload = {
        transaction_id: request.transactionId,
        refund_amount: request.amount.toFixed(2),
        refund_reference: request.reference,
      };

      const response = await fetch(`${this.getBaseUrl()}/merchant/v1/refund`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Country": this.config.countryCode,
          "X-Currency": this.config.currency,
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
        message: data.status?.message || "Refund failed",
      };
    } catch (error) {
      console.error("Airtel refund error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  private async getAccessToken(): Promise<string> {
    return this.getToken();
  }

  getStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
      SUCCESS: "Transaction completed successfully",
      PENDING: "Transaction is pending confirmation",
      FAILED: "Transaction failed",
      TS: "Transaction successful",
      PD: "Payment pending",
      FL: "Transaction failed",
    };
    return descriptions[status] || `Unknown status (${status})`;
  }
}

export const createAirtelAPI = (config: AirtelConfig): AirtelAPI => {
  return new AirtelAPI(config);
};

export const airtelAPI = new AirtelAPI({
  apiKey: process.env.AIRTEL_API_KEY || "",
  merchantCode: process.env.AIRTEL_MERCHANT_CODE || "",
  environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
  countryCode: process.env.AIRTEL_COUNTRY_CODE || "ZMB",
  currency: process.env.AIRTEL_CURRENCY || "USD",
});
