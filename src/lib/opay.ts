/**
 * OPay API Integration (Nigeria)
 * Supports: Nigeria, Egypt
 * Documentation: https://openapi.opaypay.com/
 */

export interface OPayConfig {
  merchantId: string;
  publicKey: string;
  privateKey: string;
  environment: "sandbox" | "live";
  currency: string;
}

export interface OPayPaymentRequest {
  phoneNumber: string;
  amount: number;
  reference: string;
  description: string;
  callbackUrl: string;
}

export interface OPayPaymentResponse {
  status: "SUCCESS" | "PENDING" | "FAILED";
  transactionId?: string;
  payToken?: string;
  message?: string;
}

export interface OPayTransactionStatus {
  status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED";
  transactionId: string;
  orderNo?: string;
  amount?: number;
  currency?: string;
  phoneNumber?: string;
  transactionDate?: string;
}

export interface OPayRefundRequest {
  transactionId: string;
  orderNo: string;
  amount: number;
  reason: string;
}

export interface OPayRefundResponse {
  status: string;
  refundId?: string;
  message?: string;
}

export class OPayAPI {
  private config: OPayConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: OPayConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    return this.config.environment === "sandbox"
      ? "https://sandboxapi.opaypay.com"
      : "https://api.opaypay.com";
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const timestamp = Date.now().toString();
    const signature = this.generateSignature(`POST/api/v1/oauth/token${timestamp}`, this.config.privateKey);

    const response = await fetch(`${this.getBaseUrl()}/api/v1/oauth/token`, {
      method: "POST",
      headers: {
        "OP-OPEN-KEY": this.config.publicKey,
        "OP-OPEN-SIGN": signature,
        "OP-OPEN-TIMESTAMP": timestamp,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merchant_id: this.config.merchantId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get OPay access token");
    }

    const data = await response.json();
    this.accessToken = data.data?.accessToken;
    this.tokenExpiry = Date.now() + 3600 * 1000; // 1 hour
    return this.accessToken as string;
  }

  private generateSignature(data: string, privateKey: string): string {
    // Simplified signature generation - in production, use proper RSA signing
    return Buffer.from(`${data}:${privateKey}`).toString("base64");
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

  async initiatePayment(request: OPayPaymentRequest): Promise<OPayPaymentResponse> {
    try {
      const token = await this.getAccessToken();
      const orderNo = request.reference || `OPAY-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        merchantId: this.config.merchantId,
        orderNo,
        amount: request.amount.toFixed(2),
        currency: this.config.currency,
        goodsName: request.description,
        callbackUrl: request.callbackUrl,
        payMethod: "BALANCE",
        userPhoneNo: this.formatPhoneNumber(request.phoneNumber),
      };

      const timestamp = Date.now().toString();
      const signature = this.generateSignature(
        `POST/api/v1/merchant/pay${timestamp}${JSON.stringify(payload)}`,
        this.config.privateKey
      );

      const response = await fetch(`${this.getBaseUrl()}/api/v1/merchant/pay`, {
        method: "POST",
        headers: {
          "OP-OPEN-KEY": this.config.publicKey,
          "OP-OPEN-SIGN": signature,
          "OP-OPEN-TIMESTAMP": timestamp,
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.code === "000000") {
        return {
          status: "PENDING",
          transactionId: data.data?.transactionId,
          payToken: data.data?.payToken,
          message: "Payment initiated. Customer will receive prompt.",
        };
      }

      return {
        status: "FAILED",
        message: data.message || "Payment initiation failed",
      };
    } catch (error) {
      console.error("OPay payment error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async getTransactionStatus(orderNo: string): Promise<OPayTransactionStatus> {
    try {
      const token = await this.getAccessToken();

      const payload = {
        merchantId: this.config.merchantId,
        orderNo,
      };

      const timestamp = Date.now().toString();
      const signature = this.generateSignature(
        `POST/api/v1/merchant/order/query${timestamp}${JSON.stringify(payload)}`,
        this.config.privateKey
      );

      const response = await fetch(`${this.getBaseUrl()}/api/v1/merchant/order/query`, {
        method: "POST",
        headers: {
          "OP-OPEN-KEY": this.config.publicKey,
          "OP-OPEN-SIGN": signature,
          "OP-OPEN-TIMESTAMP": timestamp,
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.code !== "000000") {
        return {
          status: "FAILED",
          transactionId: orderNo,
        };
      }

      const statusMap: Record<string, "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED"> = {
        "3": "SUCCESS",
        "1": "PENDING",
        "4": "FAILED",
        "5": "CANCELLED",
      };

      const order = data.data?.orderInfo;

      return {
        status: statusMap[order?.status] || "PENDING",
        transactionId: orderNo,
        orderNo: order?.orderNo,
        amount: order?.amount ? parseFloat(order.amount) : undefined,
        currency: order?.currency,
        phoneNumber: order?.userPhoneNo,
        transactionDate: order?.createTime,
      };
    } catch (error) {
      console.error("OPay status error:", error);
      return {
        status: "FAILED",
        transactionId: orderNo,
      };
    }
  }

  async refundPayment(request: OPayRefundRequest): Promise<OPayRefundResponse> {
    try {
      const token = await this.getAccessToken();
      const refundNo = `REFUND-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        merchantId: this.config.merchantId,
        refundNo,
        orderNo: request.orderNo,
        transactionId: request.transactionId,
        amount: request.amount.toFixed(2),
        currency: this.config.currency,
        reason: request.reason,
      };

      const timestamp = Date.now().toString();
      const signature = this.generateSignature(
        `POST/api/v1/merchant/refund${timestamp}${JSON.stringify(payload)}`,
        this.config.privateKey
      );

      const response = await fetch(`${this.getBaseUrl()}/api/v1/merchant/refund`, {
        method: "POST",
        headers: {
          "OP-OPEN-KEY": this.config.publicKey,
          "OP-OPEN-SIGN": signature,
          "OP-OPEN-TIMESTAMP": timestamp,
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.code === "000000") {
        return {
          status: "SUCCESS",
          refundId: refundNo,
          message: "Refund processed successfully",
        };
      }

      return {
        status: "FAILED",
        message: data.message || "Refund failed",
      };
    } catch (error) {
      console.error("OPay refund error:", error);
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
      "1": "Payment pending",
      "3": "Payment successful",
      "4": "Payment failed",
      "5": "Payment cancelled",
    };
    return descriptions[status] || `Unknown status (${status})`;
  }
}

export const createOPayAPI = (config: OPayConfig): OPayAPI => {
  return new OPayAPI(config);
};

export const opayAPI = new OPayAPI({
  merchantId: process.env.OPAY_MERCHANT_ID || "",
  publicKey: process.env.OPAY_PUBLIC_KEY || "",
  privateKey: process.env.OPAY_PRIVATE_KEY || "",
  environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
  currency: process.env.OPAY_CURRENCY || "NGN",
});
