/**
 * Paystack API Integration
 * Supports: Nigeria, Ghana, Kenya, South Africa
 * Documentation: https://paystack.com/docs/
 */

export interface PaystackConfig {
  secretKey: string;
  publicKey: string;
  environment: "sandbox" | "live";
}

export interface PaystackPaymentRequest {
  email: string;
  phoneNumber?: string;
  amount: number;
  currency: string;
  reference: string;
  description: string;
  callbackUrl: string;
}

export interface PaystackPaymentResponse {
  status: "SUCCESS" | "PENDING" | "FAILED";
  transactionId?: string;
  authorizationUrl?: string;
  reference?: string;
  message?: string;
}

export interface PaystackTransactionStatus {
  status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED";
  transactionId: string;
  reference?: string;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  paymentMethod?: string;
  transactionDate?: string;
}

export interface PaystackRefundRequest {
  transactionId: string;
  amount?: number;
  reason: string;
  customerBank?: string;
  customerAccount?: string;
}

export interface PaystackRefundResponse {
  status: string;
  refundId?: string;
  message?: string;
}

export interface PaystackMobileMoneyRequest {
  phoneNumber: string;
  amount: number;
  currency: string;
  reference: string;
  network: "mtn" | "vodafone";
  country: "GH" | "NG";
}

export class PaystackAPI {
  private config: PaystackConfig;

  constructor(config: PaystackConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    return this.config.environment === "sandbox"
      ? "https://api.sandbox.paystack.co"
      : "https://api.paystack.co";
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

  async initiatePayment(request: PaystackPaymentRequest): Promise<PaystackPaymentResponse> {
    try {
      const reference = request.reference || `PAYSTACK-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        email: request.email,
        amount: Math.round(request.amount * 100), // Paystack expects amount in kobo/pesewas
        currency: request.currency.toUpperCase(),
        reference,
        callback_url: request.callbackUrl,
        metadata: {
          description: request.description,
          phone_number: request.phoneNumber,
        },
      };

      const response = await fetch(`${this.getBaseUrl()}/transaction/initialize`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status) {
        return {
          status: "PENDING",
          transactionId: data.data?.id?.toString(),
          authorizationUrl: data.data?.authorization_url,
          reference: data.data?.reference,
          message: "Payment initialized successfully",
        };
      }

      return {
        status: "FAILED",
        message: data.message || "Payment initiation failed",
      };
    } catch (error) {
      console.error("Paystack payment error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async initiateMobileMoneyPayment(request: PaystackMobileMoneyRequest): Promise<PaystackPaymentResponse> {
    try {
      const reference = `PAYSTACK-MM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        email: `customer${Date.now()}@example.com`,
        amount: Math.round(request.amount * 100),
        currency: request.currency.toUpperCase(),
        reference,
        payment_channels: ["mobile_money"],
        metadata: {
          phone_number: this.formatPhoneNumber(request.phoneNumber),
          network: request.network,
          country: request.country,
        },
      };

      const response = await fetch(`${this.getBaseUrl()}/transaction/initialize`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status) {
        return {
          status: "PENDING",
          transactionId: data.data?.id?.toString(),
          authorizationUrl: data.data?.authorization_url,
          reference: data.data?.reference,
          message: "Mobile money payment initialized",
        };
      }

      return {
        status: "FAILED",
        message: data.message || "Mobile money payment initiation failed",
      };
    } catch (error) {
      console.error("Paystack mobile money error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async verifyTransaction(reference: string): Promise<PaystackTransactionStatus> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/transaction/verify/${reference}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${this.config.secretKey}`,
            "Accept": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.status) {
        return {
          status: "FAILED",
          transactionId: reference,
        };
      }

      const statusMap: Record<string, "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED"> = {
        "success": "SUCCESS",
        "pending": "PENDING",
        "failed": "FAILED",
        "abandoned": "CANCELLED",
      };

      const transaction = data.data;

      return {
        status: statusMap[transaction?.status] || "PENDING",
        transactionId: transaction?.id?.toString() || reference,
        reference: transaction?.reference,
        amount: transaction?.amount ? transaction.amount / 100 : undefined,
        currency: transaction?.currency,
        customerEmail: transaction?.customer?.email,
        paymentMethod: transaction?.authorization?.channel,
        transactionDate: transaction?.paid_at,
      };
    } catch (error) {
      console.error("Paystack verify error:", error);
      return {
        status: "FAILED",
        transactionId: reference,
      };
    }
  }

  async getTransactionById(transactionId: string): Promise<PaystackTransactionStatus> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/transaction/${transactionId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${this.config.secretKey}`,
            "Accept": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.status) {
        return {
          status: "FAILED",
          transactionId,
        };
      }

      const statusMap: Record<string, "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED"> = {
        "success": "SUCCESS",
        "pending": "PENDING",
        "failed": "FAILED",
        "abandoned": "CANCELLED",
      };

      const transaction = data.data;

      return {
        status: statusMap[transaction?.status] || "PENDING",
        transactionId,
        reference: transaction?.reference,
        amount: transaction?.amount ? transaction.amount / 100 : undefined,
        currency: transaction?.currency,
        customerEmail: transaction?.customer?.email,
        paymentMethod: transaction?.authorization?.channel,
        transactionDate: transaction?.paid_at,
      };
    } catch (error) {
      console.error("Paystack get by ID error:", error);
      return {
        status: "FAILED",
        transactionId,
      };
    }
  }

  async refundPayment(request: PaystackRefundRequest): Promise<PaystackRefundResponse> {
    try {
      const payload = {
        transaction: request.transactionId,
        amount: request.amount ? Math.round(request.amount * 100) : undefined,
        reason: request.reason,
        customer_bank: request.customerBank,
        customer_account: request.customerAccount,
      };

      const response = await fetch(`${this.getBaseUrl()}/refund`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status) {
        return {
          status: "SUCCESS",
          refundId: data.data?.id?.toString(),
          message: "Refund processed successfully",
        };
      }

      return {
        status: "FAILED",
        message: data.message || "Refund failed",
      };
    } catch (error) {
      console.error("Paystack refund error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async createSubcustomer(data: {
    businessName: string;
    email: string;
    phoneNumber: string;
    bankCode?: string;
    accountNumber?: string;
  }): Promise<{ status: string; subcustomerCode?: string; message?: string }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/subaccount`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_name: data.businessName,
          settlement_bank: data.bankCode,
          account_number: data.accountNumber,
          settlement_email: data.email,
          phone: data.phoneNumber,
        }),
      });

      const result = await response.json();

      if (response.ok && result.status) {
        return {
          status: "SUCCESS",
          subcustomerCode: result.data?.subaccount_code,
          message: "Subcustomer created successfully",
        };
      }

      return {
        status: "FAILED",
        message: result.message || "Failed to create subcustomer",
      };
    } catch (error) {
      console.error("Paystack subcustomer error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async createTransferRecipient(accountNumber: string, bankCode: string, name: string, currency: string = "NGN"): Promise<{ status: string; recipientCode?: string }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/transferrecipient`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "nuban",
          name,
          account_number: accountNumber,
          bank_code: bankCode,
          currency: currency.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.status) {
        return {
          status: "SUCCESS",
          recipientCode: data.data?.recipient_code,
        };
      }

      return {
        status: "FAILED",
      };
    } catch (error) {
      console.error("Paystack transfer recipient error:", error);
      return {
        status: "FAILED",
      };
    }
  }

  async initiateTransfer(recipientCode: string, amount: number, reason: string): Promise<{ status: string; transferCode?: string; message?: string }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/transfer`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "balance",
          amount: Math.round(amount * 100),
          recipient: recipientCode,
          reason,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status) {
        return {
          status: "SUCCESS",
          transferCode: data.data?.transfer_code,
          message: "Transfer initiated successfully",
        };
      }

      return {
        status: "FAILED",
        message: data.message || "Transfer failed",
      };
    } catch (error) {
      console.error("Paystack transfer error:", error);
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
      success: "Payment successful",
      pending: "Payment pending",
      failed: "Payment failed",
      abandoned: "Payment abandoned",
    };
    return descriptions[status] || `Unknown status (${status})`;
  }
}

export const createPaystackAPI = (config: PaystackConfig): PaystackAPI => {
  return new PaystackAPI(config);
};

export const paystackAPI = new PaystackAPI({
  secretKey: process.env.PAYSTACK_SECRET_KEY || "",
  publicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
  environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
});
