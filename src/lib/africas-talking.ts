/**
 * Africa's Talking Payment API Integration
 * Supports: Kenya, Uganda, Tanzania, Nigeria, Ghana
 * Documentation: https://build.at-labs.io/
 */

export interface AfricasTalkingConfig {
  apiKey: string;
  username: string;
  environment: "sandbox" | "live";
}

export interface AfricasTalkingPaymentRequest {
  phoneNumber: string;
  amount: number;
  currency: string;
  reference: string;
  description: string;
  provider: "Mpesa" | "Airtel" | "MTN";
}

export interface AfricasTalkingPaymentResponse {
  status: "SUCCESS" | "PENDING" | "FAILED";
  transactionId?: string;
  providerRef?: string;
  message?: string;
}

export interface AfricasTalkingTransactionStatus {
  status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED";
  transactionId: string;
  amount?: number;
  currency?: string;
  phoneNumber?: string;
  provider?: string;
  transactionDate?: string;
}

export interface AfricasTalkingCheckoutRequest {
  productName: string;
  phoneNumber: string;
  amount: number;
  currency: string;
  reference: string;
  description: string;
}

export class AfricasTalkingAPI {
  private config: AfricasTalkingConfig;

  constructor(config: AfricasTalkingConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    return this.config.environment === "sandbox"
      ? "https://api.sandbox.africastalking.com"
      : "https://api.africastalking.com";
  }

  private formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");

    if (digits.startsWith("0")) {
      return digits.slice(1);
    }

    if (digits.startsWith("+")) {
      return digits.slice(1);
    }

    return digits;
  }

  validatePhoneNumber(phone: string): boolean {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 9 && digits.length <= 15;
  }

  async initiateMobileCheckout(request: AfricasTalkingCheckoutRequest): Promise<AfricasTalkingPaymentResponse> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/payment/v1/checkout`, {
        method: "POST",
        headers: {
          "ApiKey": this.config.apiKey,
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: this.config.username,
          productName: request.productName,
          phoneNumber: this.formatPhoneNumber(request.phoneNumber),
          amount: request.amount,
          currency: request.currency,
          providerChannel: request.reference,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === "Success") {
        return {
          status: "PENDING",
          transactionId: data.transactionId,
          providerRef: data.providerRef,
          message: "Checkout request sent. Customer will receive USSD prompt.",
        };
      }

      return {
        status: "FAILED",
        message: data.errorMessage || "Checkout initiation failed",
      };
    } catch (error) {
      console.error("Africa's Talking checkout error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async initiateB2C(request: {
    productName: string;
    phoneNumber: string;
    amount: number;
    currency: string;
    reference: string;
    reason: "Salary" | "Payment" | "Promotion" | "Other";
  }): Promise<AfricasTalkingPaymentResponse> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/payment/v1/b2c`, {
        method: "POST",
        headers: {
          "ApiKey": this.config.apiKey,
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: this.config.username,
          productName: request.productName,
          recipients: [
            {
              phoneNumber: this.formatPhoneNumber(request.phoneNumber),
              amount: request.amount,
              currencyCode: request.currency,
              narration: request.reason,
              metadata: {
                reference: request.reference,
              },
            },
          ],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const entry = data.entries?.[0];
        return {
          status: entry?.status === "Queued" ? "PENDING" : "FAILED",
          transactionId: entry?.transactionId,
          providerRef: entry?.providerRef,
          message: entry?.errorMessage || "B2C payment initiated",
        };
      }

      return {
        status: "FAILED",
        message: data.errorMessage || "B2C initiation failed",
      };
    } catch (error) {
      console.error("Africa's Talking B2C error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async fetchTransactionStatus(transactionId: string): Promise<AfricasTalkingTransactionStatus> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/payment/v1/status/${transactionId}`,
        {
          method: "GET",
          headers: {
            "ApiKey": this.config.apiKey,
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
        "Success": "SUCCESS",
        "Pending": "PENDING",
        "Failed": "FAILED",
        "Cancelled": "CANCELLED",
      };

      return {
        status: statusMap[data.status] || "PENDING",
        transactionId,
        amount: data.amount,
        currency: data.currency,
        phoneNumber: data.phoneNumber,
        provider: data.provider,
        transactionDate: data.transactionDate,
      };
    } catch (error) {
      console.error("Africa's Talking status error:", error);
      return {
        status: "FAILED",
        transactionId,
      };
    }
  }

  async fetchWalletBalance(productName: string): Promise<{ status: string; balance?: number; currency?: string }> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/payment/v1/wallet/balance?productName=${encodeURIComponent(productName)}`,
        {
          method: "GET",
          headers: {
            "ApiKey": this.config.apiKey,
            "Accept": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.status === "Success") {
        return {
          status: "SUCCESS",
          balance: data.balance,
          currency: data.currency,
        };
      }

      return {
        status: "FAILED",
      };
    } catch (error) {
      console.error("Africa's Talking balance error:", error);
      return {
        status: "FAILED",
      };
    }
  }

  async findProductByName(productName: string): Promise<{ productId?: string; name?: string; status?: string }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/payment/v1/products`, {
        method: "GET",
        headers: {
          "ApiKey": this.config.apiKey,
          "Accept": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.status === "Success") {
        const product = data.products?.find((p: { name: string }) => p.name === productName);
        return {
          status: "SUCCESS",
          productId: product?.productId,
          name: product?.name,
        };
      }

      return {
        status: "FAILED",
      };
    } catch (error) {
      console.error("Africa's Talking find product error:", error);
      return {
        status: "FAILED",
      };
    }
  }

  getStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
      SUCCESS: "Payment completed successfully",
      PENDING: "Payment is pending confirmation",
      FAILED: "Payment failed",
      CANCELLED: "Payment was cancelled",
      Success: "Payment successful",
      Pending: "Payment pending",
      Failed: "Payment failed",
      Queued: "Payment queued for processing",
    };
    return descriptions[status] || `Unknown status (${status})`;
  }
}

export const createAfricasTalkingAPI = (config: AfricasTalkingConfig): AfricasTalkingAPI => {
  return new AfricasTalkingAPI(config);
};

export const africasTalkingAPI = new AfricasTalkingAPI({
  apiKey: process.env.AFRICAS_TALKING_API_KEY || "",
  username: process.env.AFRICAS_TALKING_USERNAME || "",
  environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
});
