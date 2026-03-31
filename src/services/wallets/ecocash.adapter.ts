export interface EcoCashConfig {
  apiKey: string;
  merchantCode: string;
  mode: "sandbox" | "live";
}

export interface EcoCashPaymentRequest {
  mobileNumber: string;
  amount: number;
  reason: string;
  currency: string;
  reference: string;
}

export interface EcoCashPaymentResponse {
  status: "SUCCESS" | "PENDING_VALIDATION" | "FAILED";
  sourceReference?: string;
  message?: string;
}

export interface EcoCashLookupRequest {
  mobileNumber: string;
  reference: string;
}

export interface EcoCashLookupResponse {
  paymentSuccess: boolean;
  status: string;
  amount?: { amount: number; currency: string };
  customerMsisdn?: string;
  reference?: string;
  ecocashReference?: string;
  transactionDateTime?: string;
}

export interface EcoCashRefundRequest {
  reference: string;
  phone: string;
  amount: number;
  clientName: string;
  reason: string;
  currency?: string;
}

export interface EcoCashRefundResponse {
  status: string;
  message?: string;
}

export class EcoCashAPI {
  private config: EcoCashConfig;
  private baseUrl: string;

  constructor(config: EcoCashConfig) {
    this.config = config;
    this.baseUrl = config.mode === "sandbox"
      ? "https://developers.ecocash.co.zw"
      : "https://developers.ecocash.co.zw/api/ecocash_pay";
  }

  async initPayment(
    mobileNumber: string,
    amount: number,
    reason: string,
    reference: string
  ): Promise<EcoCashPaymentResponse> {
    const payload = {
      mobileNumber: this.formatPhoneNumber(mobileNumber),
      amount,
      reason,
      currency: "USD",
      reference,
      merchantCode: this.config.merchantCode,
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/ecocash_pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          status: "FAILED",
          message: errorData.message || `HTTP error ${response.status}`,
        };
      }

      const data = await response.json();

      return {
        status: data.status === "SUCCESS" ? "SUCCESS" : "PENDING_VALIDATION",
        sourceReference: data.sourceReference || reference,
        message: data.message,
      };
    } catch (error) {
      console.error("EcoCash payment init error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async lookupTransaction(
    mobileNumber: string,
    reference: string
  ): Promise<EcoCashLookupResponse> {
    try {
      const url = new URL(`${this.baseUrl}/api/lookup_transaction`);
      url.searchParams.set("mobileNumber", this.formatPhoneNumber(mobileNumber));
      url.searchParams.set("reference", reference);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        return {
          paymentSuccess: false,
          status: "FAILED",
        };
      }

      const data = await response.json();

      return {
        paymentSuccess: data.status === "SUCCESS",
        status: data.status,
        amount: data.amount,
        customerMsisdn: data.customerMsisdn,
        reference: data.reference,
        ecocashReference: data.ecocashReference,
        transactionDateTime: data.transactionDateTime,
      };
    } catch (error) {
      console.error("EcoCash lookup error:", error);
      return {
        paymentSuccess: false,
        status: "FAILED",
      };
    }
  }

  async refundPayment(request: EcoCashRefundRequest): Promise<EcoCashRefundResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          reference: request.reference,
          phone: this.formatPhoneNumber(request.phone),
          amount: request.amount,
          clientName: request.clientName,
          reason: request.reason,
          currency: request.currency || "USD",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          status: "FAILED",
          message: errorData.message || `HTTP error ${response.status}`,
        };
      }

      const data = await response.json();

      return {
        status: data.status,
        message: data.message,
      };
    } catch (error) {
      console.error("EcoCash refund error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async pollTransaction(
    sourceReference: string,
    mobileNumber: string,
    options: {
      maxAttempts?: number;
      intervalSeconds?: number;
      onStatusChange?: (status: string) => void;
    } = {}
  ): Promise<EcoCashLookupResponse> {
    const {
      maxAttempts = 10,
      intervalSeconds = 5,
      onStatusChange,
    } = options;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.lookupTransaction(mobileNumber, sourceReference);

      if (onStatusChange) {
        onStatusChange(result.status);
      }

      if (result.status === "SUCCESS" || result.status === "FAILED") {
        return result;
      }

      if (attempt < maxAttempts - 1) {
        await this.delay(intervalSeconds * 1000);
      }
    }

    return {
      paymentSuccess: false,
      status: "TIMEOUT",
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");

    if (digits.startsWith("0")) {
      return `263${digits.slice(1)}`;
    }

    if (!digits.startsWith("263")) {
      return `263${digits}`;
    }

    return digits;
  }

  validatePhoneNumber(phone: string): boolean {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 9 && digits.length <= 12;
  }

  getStatusMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      0: "Transaction successful",
      1: "Insufficient balance",
      2: "Transaction amount less than minimum",
      3: "Transaction limit exceeded",
      4: "Unresolved party",
      11: "Duplicate request",
      17: "Transaction cancelled by user",
      1036: "Request timed out",
      2001: "Invalid merchant",
      2002: "Invalid subscriber",
    };
    return messages[statusCode] || `Unknown error (${statusCode})`;
  }

  setLiveMode(): void {
    this.baseUrl = "https://developers.ecocash.co.zw/api/ecocash_pay";
  }

  setSandboxMode(): void {
    this.baseUrl = "https://developers.ecocash.co.zw";
  }
}

export const createEcoCashAPI = (config: EcoCashConfig): EcoCashAPI => {
  return new EcoCashAPI(config);
};

export const ecocashAPI = new EcoCashAPI({
  apiKey: process.env.ECOCASH_API_KEY || "",
  merchantCode: process.env.ECOCASH_MERCHANT_CODE || "",
  mode: process.env.NODE_ENV === "production" ? "live" : "sandbox",
});
