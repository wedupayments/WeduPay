/**
 * PawaPay API Integration
 * Documentation: https://docs.pawapay.io/v2/docs/welcome
 */

export interface PawaPayConfig {
  apiToken: string;
  environment: "sandbox" | "live";
  baseUrl?: string;
}

export interface PawaPayPredictProviderRequest {
  phoneNumber: string;
  country?: string;
}

export interface PawaPayPredictProviderResponse {
  status: "SUCCESS" | "FAILED";
  provider?: string;
  country?: string;
  message?: string;
  raw?: unknown;
}

export interface PawaPayDepositRequest {
  phoneNumber: string;
  amount: number;
  currency: string;
  reference: string;
  description: string;
  callbackUrl?: string;
  provider?: string;
  country?: string;
}

export interface PawaPayPaymentResponse {
  status: "SUCCESS" | "PENDING" | "FAILED";
  transactionId?: string;
  providerReference?: string;
  provider?: string;
  message?: string;
  raw?: unknown;
}

export interface PawaPayTransactionStatus {
  success: boolean;
  status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED";
  transactionId: string;
  amount?: number;
  currency?: string;
  provider?: string;
  providerReference?: string;
  transactionDate?: string;
  raw?: unknown;
}

export interface PawaPayPayoutRequest {
  phoneNumber: string;
  amount: number;
  currency: string;
  reference: string;
  description: string;
  provider?: string;
  country?: string;
}

export interface PawaPayRefundRequest {
  depositId: string;
  amount: number;
  reason: string;
}

export class PawaPayAPI {
  private config: PawaPayConfig;
  private baseUrl: string;

  constructor(config: PawaPayConfig) {
    this.config = config;
    this.baseUrl = (
      config.baseUrl ||
      process.env.PAWAPAY_BASE_URL ||
      (config.environment === "sandbox"
        ? "https://api.sandbox.pawapay.io"
        : "https://api.pawapay.io")
    ).replace(/\/$/, "");
  }

  async predictProvider(request: PawaPayPredictProviderRequest): Promise<PawaPayPredictProviderResponse> {
    if (!this.config.apiToken) {
      return { status: "FAILED", message: "PawaPay API token is not configured" };
    }

    try {
      const response = await fetch(this.endpoint("/v2/predict-provider"), {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          msisdn: this.formatPhoneNumber(request.phoneNumber),
          ...(request.country ? { country: request.country.toUpperCase() } : {}),
        }),
      });

      const data = await this.parseResponse(response);
      const body = this.asRecord(data);

      if (!response.ok) {
        return {
          status: "FAILED",
          message: this.extractMessage(data) || `PawaPay provider prediction failed with HTTP ${response.status}`,
          raw: data,
        };
      }

      return {
        status: "SUCCESS",
        provider: this.asString(body.correspondent) || this.asString(body.provider),
        country: this.asString(body.country),
        raw: data,
      };
    } catch (error) {
      console.error("PawaPay provider prediction error:", error);
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async initiateDeposit(request: PawaPayDepositRequest): Promise<PawaPayPaymentResponse> {
    if (!this.config.apiToken) {
      return { status: "FAILED", message: "PawaPay API token is not configured" };
    }

    const depositId = this.toUuid(request.reference);
    const provider = request.provider || (await this.predictProvider(request)).provider;

    if (!provider) {
      return {
        status: "FAILED",
        transactionId: depositId,
        message: "Unable to determine PawaPay provider for phone number",
      };
    }

    try {
      const response = await fetch(this.endpoint("/v2/deposits"), {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          depositId,
          amount: String(request.amount),
          currency: request.currency.toUpperCase(),
          payer: {
            type: "MMO",
            accountDetails: {
              phoneNumber: this.formatPhoneNumber(request.phoneNumber),
              provider: provider,
            },
          },
          customerMessage: request.description.slice(0, 22),
          metadata: [
            { reference: request.reference },
            { description: request.description },
          ],
        }),
      });

      const data = await this.parseResponse(response);
      const body = this.asRecord(data);

      if (!response.ok) {
        return {
          status: "FAILED",
          transactionId: depositId,
          provider,
          message: this.extractMessage(data) || `PawaPay deposit failed with HTTP ${response.status}`,
          raw: data,
        };
      }

      return {
        status: this.normalizePaymentStatus(body.status || body.depositStatus || "PENDING"),
        transactionId: this.asString(body.depositId) || depositId,
        providerReference: this.asString(body.providerReference) || this.asString(body.correspondentIds),
        provider,
        message: this.extractMessage(data),
        raw: data,
      };
    } catch (error) {
      console.error("PawaPay deposit error:", error);
      return {
        status: "FAILED",
        transactionId: depositId,
        provider,
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async getDepositStatus(depositId: string): Promise<PawaPayTransactionStatus> {
    return this.getTransactionStatus("deposits", depositId);
  }

  async initiatePayout(request: PawaPayPayoutRequest): Promise<PawaPayPaymentResponse> {
    if (!this.config.apiToken) {
      return { status: "FAILED", message: "PawaPay API token is not configured" };
    }

    const payoutId = this.toUuid(request.reference);
    const provider = request.provider || (await this.predictProvider(request)).provider;

    if (!provider) {
      return {
        status: "FAILED",
        transactionId: payoutId,
        message: "Unable to determine PawaPay provider for phone number",
      };
    }

    try {
      const response = await fetch(this.endpoint("/v2/payouts"), {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          payoutId,
          amount: String(request.amount),
          currency: request.currency.toUpperCase(),
          recipient: {
            type: "MMO",
            accountDetails: {
              phoneNumber: this.formatPhoneNumber(request.phoneNumber),
              provider: provider,
            },
          },
          customerMessage: request.description.slice(0, 22),
          metadata: [
            { reference: request.reference },
            { description: request.description },
          ],
        }),
      });

      const data = await this.parseResponse(response);
      const body = this.asRecord(data);

      if (!response.ok) {
        return {
          status: "FAILED",
          transactionId: payoutId,
          provider,
          message: this.extractMessage(data) || `PawaPay payout failed with HTTP ${response.status}`,
          raw: data,
        };
      }

      return {
        status: this.normalizePaymentStatus(body.status || body.payoutStatus || "PENDING"),
        transactionId: this.asString(body.payoutId) || payoutId,
        providerReference: this.asString(body.providerReference),
        provider,
        message: this.extractMessage(data),
        raw: data,
      };
    } catch (error) {
      console.error("PawaPay payout error:", error);
      return {
        status: "FAILED",
        transactionId: payoutId,
        provider,
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async refundDeposit(request: PawaPayRefundRequest): Promise<PawaPayPaymentResponse> {
    if (!this.config.apiToken) {
      return { status: "FAILED", message: "PawaPay API token is not configured" };
    }

    const refundId = crypto.randomUUID();

    try {
      const response = await fetch(this.endpoint("/v2/refunds"), {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          refundId,
          depositId: request.depositId,
          amount: String(request.amount),
          reason: request.reason,
        }),
      });

      const data = await this.parseResponse(response);
      const body = this.asRecord(data);

      if (!response.ok) {
        return {
          status: "FAILED",
          transactionId: refundId,
          message: this.extractMessage(data) || `PawaPay refund failed with HTTP ${response.status}`,
          raw: data,
        };
      }

      return {
        status: this.normalizePaymentStatus(body.status || body.refundStatus || "PENDING"),
        transactionId: this.asString(body.refundId) || refundId,
        providerReference: this.asString(body.providerReference),
        message: this.extractMessage(data),
        raw: data,
      };
    } catch (error) {
      console.error("PawaPay refund error:", error);
      return {
        status: "FAILED",
        transactionId: refundId,
        message: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  validatePhoneNumber(phone: string): boolean {
    const digits = this.formatPhoneNumber(phone);
    return /^\d{9,15}$/.test(digits);
  }

  formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    return digits.startsWith("00") ? digits.slice(2) : digits;
  }

  private async getTransactionStatus(kind: "deposits" | "payouts", id: string): Promise<PawaPayTransactionStatus> {
    if (!this.config.apiToken) {
      return {
        success: false,
        status: "FAILED",
        transactionId: id,
      };
    }

    try {
      const response = await fetch(this.endpoint(`/v2/${kind}/${id}`), {
        method: "GET",
        headers: this.headers(false),
      });

      const data = await this.parseResponse(response);
      const body = this.asRecord(data);
      const status = this.normalizeStatus(body.status || body.depositStatus || body.payoutStatus);

      return {
        success: response.ok && status === "SUCCESS",
        status: response.ok ? status : "FAILED",
        transactionId: this.asString(body.depositId || body.payoutId) || id,
        amount: Number(body.amount) || undefined,
        currency: this.asString(body.currency),
        provider: this.asString(body.correspondent || body.provider),
        providerReference: this.asString(body.providerReference),
        transactionDate: this.asString(body.created || body.createdAt || body.customerTimestamp),
        raw: data,
      };
    } catch (error) {
      console.error("PawaPay status error:", error);
      return {
        success: false,
        status: "FAILED",
        transactionId: id,
      };
    }
  }

  private endpoint(path: string): string {
    return `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  }

  private headers(includeContentType = true): HeadersInit {
    return {
      Authorization: `Bearer ${this.config.apiToken}`,
      Accept: "application/json",
      ...(includeContentType ? { "Content-Type": "application/json" } : {}),
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

  private normalizeStatus(status: unknown): "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED" {
    const normalized = (this.asString(status) || "").toUpperCase();

    if (["COMPLETED", "SUCCESSFUL", "ACCEPTED"].includes(normalized)) {
      return "SUCCESS";
    }

    if (["SUBMITTED", "ENQUEUED", "PROCESSING", "PENDING"].includes(normalized)) {
      return "PENDING";
    }

    if (["CANCELLED", "CANCELED", "REJECTED"].includes(normalized)) {
      return "CANCELLED";
    }

    if (["FAILED", "DECLINED", "ERROR"].includes(normalized)) {
      return "FAILED";
    }

    return normalized === "SUCCESS" ? "SUCCESS" : "PENDING";
  }

  private normalizePaymentStatus(status: unknown): "SUCCESS" | "PENDING" | "FAILED" {
    const normalized = this.normalizeStatus(status);
    return normalized === "CANCELLED" ? "FAILED" : normalized;
  }

  private toUuid(reference: string): string {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reference)) {
      return reference;
    }

    return crypto.randomUUID();
  }

  private extractMessage(data: unknown): string | undefined {
    const body = this.asRecord(data);
    return this.asString(body.message || body.errorMessage || body.description || body.statusMessage);
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
}

export const createPawaPayAPI = (config: PawaPayConfig): PawaPayAPI => {
  return new PawaPayAPI(config);
};

export const pawapayAPI = new PawaPayAPI({
  apiToken: process.env.PAWAPAY_API_TOKEN || "",
  baseUrl: process.env.PAWAPAY_BASE_URL,
  environment: process.env.PAWAPAY_MODE === "live" || process.env.NODE_ENV === "production" ? "live" : "sandbox",
});
