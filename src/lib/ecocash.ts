export interface EcoCashConfig {
  apiKey: string;
  merchantCode?: string;
  appId?: string;
  appName?: string;
  baseUrl?: string;
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
  ecocashReference?: string;
  transactionId?: string;
  message?: string;
  raw?: unknown;
}

export interface EcoCashLookupResponse {
  paymentSuccess: boolean;
  status: string;
  amount?: { amount: number; currency: string };
  customerMsisdn?: string;
  reference?: string;
  ecocashReference?: string;
  transactionDateTime?: string;
  message?: string;
  raw?: unknown;
}

export interface EcoCashRefundRequest {
  originalEcocashTransactionReference: string;
  refundCorrelator: string;
  sourceMobileNumber: string;
  amount: number;
  clientName: string;
  currency: string;
  reasonForRefund: string;
}

export interface EcoCashRefundResponse {
  status: string;
  ecocashReference?: string;
  message?: string;
  raw?: unknown;
}

type EcoCashPayload = Record<string, unknown>;

const ECOCASH_BASE_URL = "https://developers.ecocash.co.zw";

export class EcoCashAPI {
  private config: EcoCashConfig;
  private baseUrl: string;

  constructor(config: EcoCashConfig) {
    this.config = config;
    this.baseUrl = (config.baseUrl || process.env.ECOCASH_BASE_URL || ECOCASH_BASE_URL).replace(/\/$/, "");
  }

  async initPayment(
    mobileNumber: string,
    amount: number,
    reason: string,
    reference: string,
    currency = "USD"
  ): Promise<EcoCashPaymentResponse> {
    if (!this.config.apiKey) {
      return {
        status: "FAILED",
        message: "EcoCash API key is not configured",
      };
    }

    const payload = this.withMerchantFields({
      mobileNumber: this.formatPhoneNumber(mobileNumber),
      amount,
      reason,
      currency,
      reference,
    });

    try {
      const response = await fetch(this.endpoint("/api/ecocash_pay"), {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(payload),
      });

      const data = await this.parseResponse(response);

      if (!response.ok) {
        return {
          status: "FAILED",
          message: this.extractMessage(data) || `EcoCash request failed with HTTP ${response.status}`,
          raw: data,
        };
      }

      return this.normalizePaymentResponse(data, reference);
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
    if (!this.config.apiKey) {
      return {
        paymentSuccess: false,
        status: "FAILED",
        message: "EcoCash API key is not configured",
      };
    }

    const formattedPhone = mobileNumber ? this.formatPhoneNumber(mobileNumber) : "";

    try {
      const url = new URL(this.endpoint("/api/lookup_transaction"));
      if (formattedPhone) {
        url.searchParams.set("mobileNumber", formattedPhone);
      }
      url.searchParams.set("reference", reference);

      let response = await fetch(url.toString(), {
        method: "GET",
        headers: this.headers(false),
      });

      let data = await this.parseResponse(response);

      if (!response.ok && response.status === 405) {
        response = await fetch(this.endpoint("/api/lookup_transaction"), {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify({ mobileNumber: formattedPhone, reference }),
        });
        data = await this.parseResponse(response);
      }

      if (!response.ok) {
        return {
          paymentSuccess: false,
          status: "FAILED",
          message: this.extractMessage(data) || `EcoCash lookup failed with HTTP ${response.status}`,
          raw: data,
        };
      }

      return this.normalizeLookupResponse(data, reference);
    } catch (error) {
      console.error("EcoCash lookup error:", error);
      return {
        paymentSuccess: false,
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async refundPayment(request: EcoCashRefundRequest): Promise<EcoCashRefundResponse> {
    if (!this.config.apiKey) {
      return {
        status: "FAILED",
        message: "EcoCash API key is not configured",
      };
    }

    try {
      const payload = {
        originalEcocashTransactionReference: request.originalEcocashTransactionReference,
        refundCorrelator: request.refundCorrelator,
        sourceMobileNumber: this.formatPhoneNumber(request.sourceMobileNumber),
        amount: request.amount,
        clientName: request.clientName,
        currency: request.currency,
        reasonForRefund: request.reasonForRefund,
      };

      const response = await fetch(this.endpoint("/api/refund"), {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(this.withMerchantFields(payload)),
      });

      const data = await this.parseResponse(response);

      if (!response.ok) {
        return {
          status: "FAILED",
          message: this.extractMessage(data) || `EcoCash refund failed with HTTP ${response.status}`,
          raw: data,
        };
      }

      const body = this.asRecord(data);
      return {
        status: this.normalizeStatus(body.status || body.transactionStatus || "PENDING"),
        ecocashReference: this.asString(body.ecocashReference || body.reference),
        message: this.extractMessage(data),
        raw: data,
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

      onStatusChange?.(result.status);

      if (["SUCCESS", "COMPLETED", "FAILED", "CANCELLED"].includes(result.status)) {
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

  validatePhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    return /^2637[178]\d{7}$/.test(formatted);
  }

  formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");

    if (digits.startsWith("00")) {
      return digits.slice(2);
    }

    if (digits.startsWith("0")) {
      return `263${digits.slice(1)}`;
    }

    if (!digits.startsWith("263")) {
      return `263${digits}`;
    }

    return digits;
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
    this.config.mode = "live";
  }

  setSandboxMode(): void {
    this.config.mode = "sandbox";
  }

  private endpoint(path: string): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  private headers(includeContentType = true): HeadersInit {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiKey}`,
      "X-API-Key": this.config.apiKey,
    };

    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }

    if (this.config.appId) {
      headers["X-App-Id"] = this.config.appId;
    }

    return headers;
  }

  private withMerchantFields(payload: EcoCashPayload): EcoCashPayload {
    return {
      ...payload,
      ...(this.config.merchantCode ? { merchantCode: this.config.merchantCode } : {}),
      ...(this.config.appId ? { appId: this.config.appId } : {}),
      ...(this.config.appName ? { appName: this.config.appName } : {}),
    };
  }

  private async parseResponse(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  private normalizePaymentResponse(data: unknown, fallbackReference: string): EcoCashPaymentResponse {
    const body = this.asRecord(data);
    const status = this.normalizeStatus(body.status || body.transactionStatus);
    const paymentSuccess = body.paymentSuccess === true || status === "SUCCESS" || status === "COMPLETED";
    const failed = ["FAILED", "CANCELLED", "ERROR", "DECLINED"].includes(status);

    return {
      status: paymentSuccess ? "SUCCESS" : failed ? "FAILED" : "PENDING_VALIDATION",
      sourceReference: this.asString(
        body.sourceReference ||
        body.reference ||
        body.transactionReference ||
        body.transactionId ||
        body.ecocashReference ||
        fallbackReference
      ),
      ecocashReference: this.asString(body.ecocashReference || body.providerReference),
      transactionId: this.asString(body.transactionId),
      message: this.extractMessage(data),
      raw: data,
    };
  }

  private normalizeLookupResponse(data: unknown, fallbackReference: string): EcoCashLookupResponse {
    const body = this.asRecord(data);
    const status = this.normalizeStatus(body.status || body.transactionStatus);
    const amount = this.normalizeAmount(body.amount, body.currency);
    const paymentSuccess = body.paymentSuccess === true || status === "SUCCESS" || status === "COMPLETED";

    return {
      paymentSuccess,
      status: paymentSuccess ? "SUCCESS" : status || "PENDING",
      amount,
      customerMsisdn: this.asString(body.customerMsisdn || body.mobileNumber || body.sourceMobileNumber),
      reference: this.asString(body.reference || fallbackReference),
      ecocashReference: this.asString(body.ecocashReference || body.providerReference || body.transactionId),
      transactionDateTime: this.asString(body.transactionDateTime || body.timestamp || body.paidAt),
      message: this.extractMessage(data),
      raw: data,
    };
  }

  private normalizeAmount(amount: unknown, currency: unknown): { amount: number; currency: string } | undefined {
    if (typeof amount === "object" && amount !== null) {
      const value = this.asRecord(amount);
      const nestedAmount = Number(value.amount);
      if (Number.isFinite(nestedAmount)) {
        return {
          amount: nestedAmount,
          currency: this.asString(value.currency) || this.asString(currency) || "USD",
        };
      }
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) {
      return undefined;
    }

    return {
      amount: numericAmount,
      currency: this.asString(currency) || "USD",
    };
  }

  private normalizeStatus(status: unknown): string {
    if (typeof status === "number") {
      return status === 0 ? "SUCCESS" : status === 17 ? "CANCELLED" : "FAILED";
    }

    const normalized = (this.asString(status) || "").toUpperCase();
    if (!normalized) {
      return "PENDING";
    }

    if (["PAID", "APPROVED", "COMPLETED", "SUCCESSFUL"].includes(normalized)) {
      return "SUCCESS";
    }

    if (["PENDING_VALIDATION", "PROCESSING", "INITIATED"].includes(normalized)) {
      return "PENDING";
    }

    return normalized;
  }

  private extractMessage(data: unknown): string | undefined {
    const body = this.asRecord(data);
    return this.asString(body.message || body.description || body.errorMessage || body.statusMessage);
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  }

  private asString(value: unknown): string | undefined {
    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    return undefined;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const createEcoCashAPI = (config: EcoCashConfig): EcoCashAPI => {
  return new EcoCashAPI(config);
};

export const ecocashAPI = new EcoCashAPI({
  apiKey: process.env.ECOCASH_API_KEY || "",
  merchantCode: process.env.ECOCASH_MERCHANT_CODE || "",
  appId: process.env.ECOCASH_APP_ID || "",
  appName: process.env.ECOCASH_APP_NAME || "WeduPay",
  baseUrl: process.env.ECOCASH_BASE_URL,
  mode: process.env.ECOCASH_MODE === "live" || process.env.NODE_ENV === "production" ? "live" : "sandbox",
});
