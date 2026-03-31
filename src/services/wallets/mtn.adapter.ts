export interface MTNConfig {
  apiKey: string;
  subscriptionKey: string;
  primaryKey: string;
  referenceId: string;
  environment: "sandbox" | "live";
  countryCode: string;
  currency: string;
}

export interface MTNPaymentRequest {
  phoneNumber: string;
  amount: number;
  reference: string;
  description: string;
  callbackUrl: string;
}

export interface MTNPaymentResponse {
  status: string;
  referenceId?: string;
  externalId?: string;
  message?: string;
}

export interface MTNCollectionRequest {
  amount: {
    amount: string;
    currency: string;
  };
  currency: string;
  customerReference: string;
  payeeNote: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  referenceId: string;
}

export interface MTNTransactionStatus {
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  referenceId: string;
  amount?: string;
  currency?: string;
  partyId?: string;
  creationDate?: string;
  modificationDate?: string;
  serviceStatus?: string;
}

export interface MTNRefundRequest {
  referenceId: string;
  amount: string;
  currency?: string;
}

export interface MTNRefundResponse {
  status: string;
  referenceId?: string;
}

export class MTNAPI {
  private config: MTNConfig;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: MTNConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    return this.config.environment === "sandbox"
      ? "https://sandbox.momodeveloper.mtn.com"
      : "https://proxy.momo.mtn.com";
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const credentials = Buffer.from(
      `${this.config.subscriptionKey}:${this.config.apiKey}`
    ).toString("base64");

    const response = await fetch(`${this.getBaseUrl()}/collection/token/`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Ocp-Apim-Subscription-Key": this.config.subscriptionKey,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get MTN access token");
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

  async requestToPay(request: MTNPaymentRequest): Promise<MTNPaymentResponse> {
    try {
      const token = await this.getToken();
      const referenceId = request.reference || crypto.randomUUID();

      const payload: MTNCollectionRequest = {
        amount: {
          amount: request.amount.toFixed(2),
          currency: this.config.currency,
        },
        currency: this.config.currency,
        customerReference: request.reference,
        payeeNote: request.description,
        payer: {
          partyIdType: "MSISDN",
          partyId: this.formatPhoneNumber(request.phoneNumber),
        },
        referenceId,
      };

      const response = await fetch(`${this.getBaseUrl()}/collection/v1_0/requesttopay`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Ocp-Apim-Subscription-Key": this.config.subscriptionKey,
          "X-Reference-Id": referenceId,
          "X-Target-Environment": this.config.environment === "sandbox" ? "sandbox" : "mtngo",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 202 || response.ok) {
        return {
          status: "PENDING",
          referenceId,
          message: "Payment request accepted. Please check your phone to confirm.",
        };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        status: "FAILED",
        message: errorData.message || `Request failed with status ${response.status}`,
      };
    } catch (error) {
      console.error("MTN request to pay error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async getTransactionStatus(referenceId: string): Promise<MTNTransactionStatus> {
    try {
      const token = await this.getToken();

      const response = await fetch(
        `${this.getBaseUrl()}/collection/v1_0/requesttopay/${referenceId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Ocp-Apim-Subscription-Key": this.config.subscriptionKey,
            "X-Target-Environment": this.config.environment === "sandbox" ? "sandbox" : "mtngo",
          },
        }
      );

      if (!response.ok) {
        return {
          status: "FAILED",
          referenceId,
          serviceStatus: "NOT_FOUND",
        };
      }

      const data = await response.json();

      const statusMap: Record<string, "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED"> = {
        PENDING: "PENDING",
        SUCCESSFUL: "SUCCESS",
        FAILED: "FAILED",
        CANCELLED: "CANCELLED",
      };

      return {
        status: statusMap[data.status] || "PENDING",
        referenceId,
        amount: data.amount?.amount,
        currency: data.amount?.currency,
        partyId: data.payer?.partyId,
        creationDate: data.creationDate,
        modificationDate: data.modificationDate,
        serviceStatus: data.status,
      };
    } catch (error) {
      console.error("MTN transaction status error:", error);
      return {
        status: "FAILED",
        referenceId,
        serviceStatus: "ERROR",
      };
    }
  }

  async requestRefund(request: MTNRefundRequest): Promise<MTNRefundResponse> {
    try {
      const token = await this.getToken();
      const referenceId = crypto.randomUUID();

      const payload = {
        referenceId,
        amount: {
          amount: request.amount,
          currency: request.currency || this.config.currency,
        },
      };

      const response = await fetch(
        `${this.getBaseUrl()}/collection/v1_0/requesttorefund/${request.referenceId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Ocp-Apim-Subscription-Key": this.config.subscriptionKey,
            "X-Reference-Id": referenceId,
            "X-Target-Environment": this.config.environment === "sandbox" ? "sandbox" : "mtngo",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.status === 202 || response.ok) {
        return {
          status: "PENDING",
          referenceId,
        };
      }

      return {
        status: "FAILED",
      };
    } catch (error) {
      console.error("MTN refund error:", error);
      return {
        status: "FAILED",
      };
    }
  }

  getStatusDescription(serviceStatus: string | undefined): string {
    const descriptions: Record<string, string> = {
      PENDING: "Transaction is pending confirmation",
      SUCCESSFUL: "Transaction completed successfully",
      FAILED: "Transaction failed",
      CANCELLED: "Transaction was cancelled",
      NOT_FOUND: "Transaction not found",
      ERROR: "An error occurred while checking status",
    };
    return descriptions[serviceStatus || ""] || `Unknown status (${serviceStatus})`;
  }

  parseWebhookPayload(payload: Record<string, unknown>): {
    referenceId: string;
    status: string;
    amount?: string;
    currency?: string;
    partyId?: string;
  } {
    return {
      referenceId: (payload.referenceId as string) || "",
      status: (payload.status as string) || "UNKNOWN",
      amount: (payload.amount as { amount: string })?.amount,
      currency: (payload.amount as { currency: string })?.currency,
      partyId: (payload.payer as { partyId: string })?.partyId,
    };
  }
}

export const createMTNAPI = (config: MTNConfig): MTNAPI => {
  return new MTNAPI(config);
};

export const mtnAPI = new MTNAPI({
  apiKey: process.env.MTN_API_KEY || "",
  subscriptionKey: process.env.MTN_SUBSCRIPTION_KEY || "",
  primaryKey: process.env.MTN_PRIMARY_KEY || "",
  referenceId: process.env.MTN_REFERENCE_ID || "",
  environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
  countryCode: process.env.MTN_COUNTRY_CODE || "256",
  currency: process.env.MTN_CURRENCY || "USD",
});
