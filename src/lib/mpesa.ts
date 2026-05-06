export interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortCode: string;
  passkey: string;
  environment: "sandbox" | "live";
  baseUrl?: string;
  callbackBaseUrl?: string;
}

export interface MpesaPaymentRequest {
  phoneNumber: string;
  amount: number;
  reference: string;
  description: string;
  callbackUrl: string;
}

export interface MpesaPaymentResponse {
  checkoutRequestId?: string;
  merchantRequestId?: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
  raw?: unknown;
}

export interface MpesaTransactionStatus {
  originatorConversationID?: string;
  conversationID?: string;
  responseCode: string;
  responseDescription: string;
  transactionReceipt?: string;
  transactionDate?: string;
  transactionAmount?: number;
  raw?: unknown;
}

export interface MpesaRefundRequest {
  transactionId: string;
  amount: number;
  receiverParty: string;
  remarks: string;
  occasion?: string;
}

export interface MpesaRefundResponse {
  conversationID?: string;
  originatorConversationID?: string;
  responseCode: string;
  responseDescription: string;
  raw?: unknown;
}

const MPESA_SANDBOX_BASE_URL = "https://sandbox.safaricom.co.ke";
const MPESA_LIVE_BASE_URL = "https://api.safaricom.co.ke";

export class MpesaAPI {
  private config: MpesaConfig;
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor(config: MpesaConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    if (this.config.baseUrl) {
      return this.config.baseUrl.replace(/\/$/, "");
    }

    return this.config.environment === "sandbox"
      ? MPESA_SANDBOX_BASE_URL
      : MPESA_LIVE_BASE_URL;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.config.consumerKey || !this.config.consumerSecret) {
      throw new Error("M-Pesa consumer credentials are not configured");
    }

    const auth = Buffer.from(
      `${this.config.consumerKey}:${this.config.consumerSecret}`
    ).toString("base64");

    const response = await fetch(
      `${this.getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get M-Pesa access token");
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (Number(data.expires_in || 0) - 60) * 1000;
    return this.accessToken as string;
  }

  formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");

    if (digits.startsWith("0")) {
      return `254${digits.slice(1)}`;
    }

    if (digits.startsWith("254")) {
      return digits;
    }

    return `254${digits}`;
  }

  validatePhoneNumber(phone: string): boolean {
    return /^254(7|1)\d{8}$/.test(this.formatPhoneNumber(phone));
  }

  getCallbackUrl(): string {
    const baseUrl =
      this.config.callbackBaseUrl ||
      process.env.MPESA_CALLBACK_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    return `${baseUrl.replace(/\/$/, "")}/api/v1/webhooks/mpesa`;
  }

  async initiateSTKPush(request: MpesaPaymentRequest): Promise<MpesaPaymentResponse> {
    try {
      const token = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.getSTKPassword(timestamp);

      const payload = {
        BusinessShortCode: this.config.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(request.amount),
        PartyA: this.formatPhoneNumber(request.phoneNumber),
        PartyB: this.config.shortCode,
        PhoneNumber: this.formatPhoneNumber(request.phoneNumber),
        CallBackURL: request.callbackUrl,
        AccountReference: request.reference,
        TransactionDesc: request.description,
      };

      const response = await fetch(`${this.getBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        return {
          checkoutRequestId: data.CheckoutRequestID,
          merchantRequestId: data.MerchantRequestID,
          responseCode: String(data.ResponseCode ?? "0"),
          responseDescription: data.ResponseDescription || "Accepted",
          customerMessage: data.CustomerMessage || "Request accepted",
          raw: data,
        };
      }

      return {
        responseCode: String(data.errorCode || "999999"),
        responseDescription: data.errorMessage || "STK push failed",
        customerMessage: data.errorMessage || "An error occurred",
        raw: data,
      };
    } catch (error) {
      console.error("M-Pesa STK push error:", error);
      return {
        responseCode: "999999",
        responseDescription: error instanceof Error ? error.message : "Network error",
        customerMessage: "Failed to initiate payment",
      };
    }
  }

  async querySTKStatus(checkoutRequestId: string): Promise<MpesaTransactionStatus> {
    try {
      const token = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.getSTKPassword(timestamp);

      const payload = {
        BusinessShortCode: this.config.shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await fetch(`${this.getBaseUrl()}/mpesa/stkpush/v1/queryrequest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      return {
        conversationID: data.ConversationID,
        originatorConversationID: data.OriginatorConversationID,
        responseCode: String(data.ResponseCode ?? data.ResultCode ?? "999999"),
        responseDescription: data.ResponseDescription || data.ResultDesc || "Unknown",
        transactionReceipt: data.TransactionReceipt || data.MpesaReceiptNumber,
        transactionDate: data.TransactionCompletedDateTime || data.TransactionDate || data.TransactionCompletedReceiveTime,
        transactionAmount: typeof data.Amount === "number" ? data.Amount : undefined,
        raw: data,
      };
    } catch (error) {
      console.error("M-Pesa STK query error:", error);
      return {
        responseCode: "999999",
        responseDescription: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async reverseTransaction(request: MpesaRefundRequest): Promise<MpesaRefundResponse> {
    try {
      const token = await this.getAccessToken();

      const payload = {
        CommandID: "TransactionReversal",
        TransactionID: request.transactionId,
        Amount: Math.round(request.amount),
        ReceiverParty: request.receiverParty,
        RecieverIdentifierType: "11",
        Remarks: request.remarks,
        Occasion: request.occasion || "",
        Initiator: process.env.MPESA_INITIATOR_NAME || "",
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || "",
        QueueTimeOutURL: `${this.getCallbackUrl()}/timeout`,
        ResultURL: `${this.getCallbackUrl()}/result`,
      };

      const response = await fetch(`${this.getBaseUrl()}/mpesa/reversal/v1/request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      return {
        conversationID: data.ConversationID,
        originatorConversationID: data.OriginatorConversationID,
        responseCode: String(data.ResponseCode || "999999"),
        responseDescription: data.ResponseDescription || data.errorMessage || "Unknown",
        raw: data,
      };
    } catch (error) {
      console.error("M-Pesa reversal error:", error);
      return {
        responseCode: "999999",
        responseDescription: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async c2bRegisterUrls(callbackUrls: { validationUrl: string; confirmationUrl: string }): Promise<boolean> {
    try {
      const token = await this.getAccessToken();

      const payload = {
        ShortCode: this.config.shortCode,
        ResponseType: "Completed",
        ValidationURL: callbackUrls.validationUrl,
        ConfirmationURL: callbackUrls.confirmationUrl,
      };

      const response = await fetch(`${this.getBaseUrl()}/mpesa/c2b/v1/registerurl`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (error) {
      console.error("M-Pesa URL registration error:", error);
      return false;
    }
  }

  getStatusDescription(responseCode: string): string {
    const descriptions: Record<string, string> = {
      "0": "Success",
      "1": "Insufficient balance",
      "2": "Less than minimum transaction value",
      "3": "Exceeds daily transfer limit",
      "4": "Would exceed recipient limit",
      "5": "Unresolved primary party",
      "6": "Unresolved receiver party",
      "7": "Would exceed sender daily limit",
      "8": "Would exceed recipient daily limit",
      "11": "Business not subscribed to B2C",
      "12": "Invalid business shortcode",
      "13": "Invalid account reference",
      "14": "Invalid gateway request",
      "15": "Transaction has already been processed",
      "17": "Transaction was cancelled by user",
      "999999": "Internal error",
    };
    return descriptions[responseCode] || `Unknown error (${responseCode})`;
  }

  parseCallbackPayload(payload: Record<string, unknown>): {
    resultCode: string;
    resultDesc: string;
    merchantRequestId?: string;
    checkoutRequestId?: string;
    amount?: number;
    accountReference?: string;
    phoneNumber?: string;
    transactionId?: string;
    transactionDate?: string;
  } {
    const callback = (payload.Body as { stkCallback?: Record<string, unknown> } | undefined)?.stkCallback || {};
    const items = (((callback.CallbackMetadata as { Item?: Array<{ Name: string; Value?: string | number }> } | undefined)?.Item) || []);
    const getItem = (name: string) => items.find((item) => item.Name === name)?.Value;

    return {
      resultCode: String(callback.ResultCode ?? "999999"),
      resultDesc: String(callback.ResultDesc || "Unknown"),
      merchantRequestId: callback.MerchantRequestID as string | undefined,
      checkoutRequestId: callback.CheckoutRequestID as string | undefined,
      amount: typeof getItem("Amount") === "number" ? Number(getItem("Amount")) : Number(getItem("Amount") || NaN) || undefined,
      accountReference: callback.AccountReference as string | undefined,
      phoneNumber: typeof getItem("PhoneNumber") === "number" ? String(getItem("PhoneNumber")) : getItem("PhoneNumber") as string | undefined,
      transactionId: getItem("MpesaReceiptNumber") as string | undefined,
      transactionDate: typeof getItem("TransactionDate") === "number" ? String(getItem("TransactionDate")) : getItem("TransactionDate") as string | undefined,
    };
  }

  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  private getSTKPassword(timestamp: string): string {
    return Buffer.from(
      `${this.config.shortCode}${this.config.passkey}${timestamp}`
    ).toString("base64");
  }
}

export const createMpesaAPI = (config: MpesaConfig): MpesaAPI => {
  return new MpesaAPI(config);
};

export const mpesaAPI = new MpesaAPI({
  consumerKey: process.env.MPESA_CONSUMER_KEY || "",
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || "",
  shortCode: process.env.MPESA_SHORT_CODE || "",
  passkey: process.env.MPESA_PASSKEY || "",
  baseUrl: process.env.MPESA_BASE_URL,
  callbackBaseUrl: process.env.MPESA_CALLBACK_BASE_URL,
  environment: process.env.MPESA_ENVIRONMENT === "live" || process.env.NODE_ENV === "production" ? "live" : "sandbox",
});
