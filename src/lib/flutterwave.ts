/**
 * Flutterwave API Integration (Pan-African Payment Gateway)
 * Supports: Nigeria, Ghana, Kenya, South Africa, Rwanda, Uganda, Tanzania, Zambia, Malawi, Zimbabwe
 * Documentation: https://developer.flutterwave.com/
 */

export interface FlutterwaveConfig {
  publicKey: string;
  secretKey: string;
  environment: "sandbox" | "live";
}

export interface FlutterwavePaymentRequest {
  phoneNumber?: string;
  email?: string;
  amount: number;
  currency: string;
  reference: string;
  description: string;
  callbackUrl: string;
  paymentMethod?: "card" | "mobile_money" | "bank_transfer" | "ussd";
  country?: string;
}

export interface FlutterwavePaymentResponse {
  status: "SUCCESS" | "PENDING" | "FAILED";
  transactionId?: string;
  link?: string;
  message?: string;
}

export interface FlutterwaveTransactionStatus {
  status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED";
  transactionId: string;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod?: string;
  transactionDate?: string;
}

export interface FlutterwaveRefundRequest {
  transactionId: string;
  amount?: number;
  reason: string;
}

export interface FlutterwaveRefundResponse {
  status: string;
  refundId?: string;
  message?: string;
}

export interface FlutterwaveMobileMoneyRequest {
  phoneNumber: string;
  amount: number;
  currency: string;
  reference: string;
  network: "mtn" | "vodafone" | "airtel" | "tigo" | "mpesa" | "ecocash";
  country: string;
}

export class FlutterwaveAPI {
  private config: FlutterwaveConfig;

  constructor(config: FlutterwaveConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    return this.config.environment === "sandbox"
      ? "https://api.flutterwave-sandbox.com"
      : "https://api.flutterwave.com";
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

  async initiatePayment(request: FlutterwavePaymentRequest): Promise<FlutterwavePaymentResponse> {
    try {
      const reference = request.reference || `FLW-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload: Record<string, unknown> = {
        tx_ref: reference,
        amount: request.amount,
        currency: request.currency,
        redirect_url: request.callbackUrl,
        customer: {
          email: request.email,
          phone_number: request.phoneNumber ? this.formatPhoneNumber(request.phoneNumber) : undefined,
          name: request.description,
        },
        customizations: {
          title: "Payment",
          description: request.description,
        },
        payment_options: request.paymentMethod || "card,mobilemoney,ussd",
        country: request.country || "NG",
      };

      const response = await fetch(`${this.getBaseUrl()}/v3/payments`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        return {
          status: "PENDING",
          transactionId: data.data?.id,
          link: data.data?.link,
          message: "Payment link generated",
        };
      }

      return {
        status: "FAILED",
        message: data.message || "Payment initiation failed",
      };
    } catch (error) {
      console.error("Flutterwave payment error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async initiateMobileMoneyPayment(request: FlutterwaveMobileMoneyRequest): Promise<FlutterwavePaymentResponse> {
    try {
      const reference = `FLW-MM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        tx_ref: reference,
        amount: request.amount,
        currency: request.currency,
        payment_type: "mobilemoneyfrance",
        network: request.network,
        country: request.country,
        customer: {
          phone_number: this.formatPhoneNumber(request.phoneNumber),
        },
      };

      const response = await fetch(`${this.getBaseUrl()}/v3/charges?type=mobilemoneyfrance`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        return {
          status: "PENDING",
          transactionId: data.data?.id,
          message: "Mobile money payment initiated. Customer will receive USSD prompt.",
        };
      }

      return {
        status: "FAILED",
        message: data.message || "Mobile money payment initiation failed",
      };
    } catch (error) {
      console.error("Flutterwave mobile money error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async getTransactionStatus(transactionId: string): Promise<FlutterwaveTransactionStatus> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/v3/transactions/${transactionId}/verify`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${this.config.secretKey}`,
            "Accept": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        return {
          status: "FAILED",
          transactionId,
        };
      }

      const statusMap: Record<string, "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED"> = {
        "successful": "SUCCESS",
        "pending": "PENDING",
        "failed": "FAILED",
        "cancelled": "CANCELLED",
      };

      const transaction = data.data;

      return {
        status: statusMap[transaction?.status] || "PENDING",
        transactionId,
        amount: transaction?.amount,
        currency: transaction?.currency,
        customerEmail: transaction?.customer?.email,
        customerPhone: transaction?.customer?.phone_number,
        paymentMethod: transaction?.payment_method,
        transactionDate: transaction?.created_at,
      };
    } catch (error) {
      console.error("Flutterwave status error:", error);
      return {
        status: "FAILED",
        transactionId,
      };
    }
  }

  async verifyTransactionByReference(reference: string): Promise<FlutterwaveTransactionStatus> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/v3/transactions/verify_by_reference?tx_ref=${reference}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${this.config.secretKey}`,
            "Accept": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        return {
          status: "FAILED",
          transactionId: reference,
        };
      }

      const statusMap: Record<string, "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED"> = {
        "successful": "SUCCESS",
        "pending": "PENDING",
        "failed": "FAILED",
        "cancelled": "CANCELLED",
      };

      const transaction = data.data;

      return {
        status: statusMap[transaction?.status] || "PENDING",
        transactionId: transaction?.id || reference,
        amount: transaction?.amount,
        currency: transaction?.currency,
        customerEmail: transaction?.customer?.email,
        customerPhone: transaction?.customer?.phone_number,
        paymentMethod: transaction?.payment_method,
        transactionDate: transaction?.created_at,
      };
    } catch (error) {
      console.error("Flutterwave verify by reference error:", error);
      return {
        status: "FAILED",
        transactionId: reference,
      };
    }
  }

  async refundPayment(request: FlutterwaveRefundRequest): Promise<FlutterwaveRefundResponse> {
    try {
      const payload = {
        tx_ref: request.transactionId,
        amount: request.amount,
        reason: request.reason,
      };

      const response = await fetch(`${this.getBaseUrl()}/v3/refunds`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        return {
          status: "SUCCESS",
          refundId: data.data?.id,
          message: "Refund processed successfully",
        };
      }

      return {
        status: "FAILED",
        message: data.message || "Refund failed",
      };
    } catch (error) {
      console.error("Flutterwave refund error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async createVirtualAccount(customerEmail: string, currency: string = "NGN"): Promise<{ accountNumber?: string; bankName?: string; status: string }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/v3/virtual-accounts`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            email: customerEmail,
          },
          currency,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        return {
          status: "SUCCESS",
          accountNumber: data.data?.account_number,
          bankName: data.data?.bank_name,
        };
      }

      return {
        status: "FAILED",
      };
    } catch (error) {
      console.error("Flutterwave virtual account error:", error);
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
      successful: "Payment successful",
      pending: "Payment pending",
      failed: "Payment failed",
    };
    return descriptions[status] || `Unknown status (${status})`;
  }
}

export const createFlutterwaveAPI = (config: FlutterwaveConfig): FlutterwaveAPI => {
  return new FlutterwaveAPI(config);
};

export const flutterwaveAPI = new FlutterwaveAPI({
  publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || "",
  secretKey: process.env.FLUTTERWAVE_SECRET_KEY || "",
  environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
});
