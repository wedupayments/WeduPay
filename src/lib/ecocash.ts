export interface EcoCashPushPaymentRequest {
  amount: number;
  currency: string;
  subscriberMsisdn: string;
  merchantMsisdn: string;
  transactionReference: string;
  description?: string;
}

export interface EcoCashPushPaymentResponse {
  status: "PENDING" | "SUCCESS" | "FAILED";
  transactionId?: string;
  merchantRequestId?: string;
  checkoutRequestId?: string;
  resultCode?: number;
  resultDesc?: string;
  statusMessage?: string;
}

export interface EcoCashPullPaymentRequest {
  amount: number;
  currency: string;
  subscriberMsisdn: string;
  merchantMsisdn: string;
  otp?: string;
  transactionReference: string;
  description?: string;
}

export interface EcoCashPullPaymentResponse {
  status: "PENDING" | "SUCCESS" | "FAILED";
  transactionId?: string;
  pullRequestId?: string;
  statusMessage?: string;
}

export interface EcoCashRefundRequest {
  originalTransactionId: string;
  amount: number;
  currency: string;
  reason: string;
}

export interface EcoCashRefundResponse {
  status: "SUCCESS" | "FAILED";
  refundId?: string;
  message?: string;
}

export class EcoCashAPI {
  private baseUrl: string;
  private apiKey: string;
  private merchantMsisdn: string;

  constructor(config: {
    baseUrl: string;
    apiKey: string;
    merchantMsisdn: string;
  }) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.merchantMsisdn = config.merchantMsisdn;
  }

  async initiatePushPayment(
    request: EcoCashPushPaymentRequest
  ): Promise<EcoCashPushPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "X-Transaction-Reference": request.transactionReference,
        },
        body: JSON.stringify({
          amount: request.amount,
          currency: request.currency,
          subscriberMsisdn: this.formatPhoneNumber(request.subscriberMsisdn),
          merchantMsisdn: this.merchantMsisdn,
          transactionReference: request.transactionReference,
          description: request.description || "WeduPay Payment",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          status: "FAILED",
          resultDesc: error.message || "Payment initiation failed",
        };
      }

      const data = await response.json();
      
      return {
        status: "PENDING",
        transactionId: data.transactionId || request.transactionReference,
        merchantRequestId: data.merchantRequestId,
        checkoutRequestId: data.checkoutRequestId,
        resultCode: data.resultCode,
        resultDesc: data.resultDesc,
      };
    } catch (error) {
      console.error("EcoCash push payment error:", error);
      return {
        status: "FAILED",
        resultDesc: "Network error during payment initiation",
      };
    }
  }

  async checkPushPaymentStatus(
    checkoutRequestId: string
  ): Promise<EcoCashPushPaymentResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/push/${checkoutRequestId}/status`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        return {
          status: "FAILED",
          resultDesc: "Failed to check payment status",
        };
      }

      const data = await response.json();

      return {
        status: data.status === "SUCCESS" ? "SUCCESS" : "PENDING",
        transactionId: data.transactionId,
        checkoutRequestId: data.checkoutRequestId,
        resultCode: data.resultCode,
        resultDesc: data.resultDesc,
      };
    } catch (error) {
      console.error("EcoCash status check error:", error);
      return {
        status: "FAILED",
        resultDesc: "Network error during status check",
      };
    }
  }

  async initiatePullPayment(
    request: EcoCashPullPaymentRequest
  ): Promise<EcoCashPullPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "X-Transaction-Reference": request.transactionReference,
        },
        body: JSON.stringify({
          amount: request.amount,
          currency: request.currency,
          subscriberMsisdn: this.formatPhoneNumber(request.subscriberMsisdn),
          merchantMsisdn: this.merchantMsisdn,
          otp: request.otp,
          transactionReference: request.transactionReference,
          description: request.description || "WeduPay Collection",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          status: "FAILED",
          statusMessage: error.message || "Pull payment initiation failed",
        };
      }

      const data = await response.json();

      return {
        status: data.status === "PENDING" ? "PENDING" : "SUCCESS",
        transactionId: data.transactionId,
        pullRequestId: data.pullRequestId,
        statusMessage: data.statusMessage,
      };
    } catch (error) {
      console.error("EcoCash pull payment error:", error);
      return {
        status: "FAILED",
        statusMessage: "Network error during pull payment initiation",
      };
    }
  }

  async processRefund(request: EcoCashRefundRequest): Promise<EcoCashRefundResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          originalTransactionId: request.originalTransactionId,
          amount: request.amount,
          currency: request.currency,
          reason: request.reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          status: "FAILED",
          message: error.message || "Refund failed",
        };
      }

      const data = await response.json();

      return {
        status: "SUCCESS",
        refundId: data.refundId,
        message: data.message || "Refund processed successfully",
      };
    } catch (error) {
      console.error("EcoCash refund error:", error);
      return {
        status: "FAILED",
        message: "Network error during refund processing",
      };
    }
  }

  private formatPhoneNumber(phone: string): string {
    let formatted = phone.replace(/\D/g, "");
    
    if (formatted.startsWith("0")) {
      formatted = "263" + formatted.slice(1);
    }
    
    if (!formatted.startsWith("263")) {
      formatted = "263" + formatted;
    }
    
    return formatted;
  }

  validatePhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length >= 9 && cleaned.length <= 12;
  }

  getPaymentStatus(statusCode: number): string {
    const statusMap: Record<number, string> = {
      0: "SUCCESS",
      1: "INSUFFICIENT_BALANCE",
      2: "LESS_THAN_MINIMUM",
      3: "EXCEEDED_LIMIT",
      4: "UNRESOLVED_PARTY",
      11: "DUPLICATE_REQUEST",
      17: "CANCELLED",
      1036: "TIMEOUT",
      2001: "INVALID_MERCHANT",
      2002: "INVALID_SUBSCRIBER",
    };
    return statusMap[statusCode] || `ERROR_${statusCode}`;
  }
}

export const ecocashAPI = new EcoCashAPI({
  baseUrl: process.env.ECOCASH_API_URL || "https://api.ecocash.co.zw",
  apiKey: process.env.ECOCASH_API_KEY || "",
  merchantMsisdn: process.env.ECOCASH_MERCHANT_MSISDN || "",
});
