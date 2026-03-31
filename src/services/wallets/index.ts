export * from "./ecocash.adapter";
export * from "./mpesa.adapter";
export * from "./mtn.adapter";

import { EcoCashAPI } from "./ecocash.adapter";
import { MpesaAPI } from "./mpesa.adapter";
import { MTNAPI } from "./mtn.adapter";
import { EcoCashPaymentResponse } from "./ecocash.adapter";
import { MpesaPaymentResponse } from "./mpesa.adapter";
import { MTNPaymentResponse } from "./mtn.adapter";

export type WalletProvider = "ecocash" | "mpesa" | "mtn" | "airtel";

export interface PaymentResult {
  success: boolean;
  status: "SUCCESS" | "PENDING" | "FAILED";
  reference: string;
  providerReference?: string;
  message?: string;
}

export interface TransactionLookupResult {
  success: boolean;
  status: string;
  amount?: number;
  currency?: string;
  reference?: string;
  providerReference?: string;
  timestamp?: string;
}

export interface WalletAdapter {
  initiatePayment(
    phoneNumber: string,
    amount: number,
    reference: string,
    description: string
  ): Promise<PaymentResult>;
  
  lookupTransaction(reference: string): Promise<TransactionLookupResult>;
  validatePhoneNumber(phone: string): boolean;
  formatPhoneNumber(phone: string): string;
  getProviderName(): string;
}

export class EcoCashAdapter implements WalletAdapter {
  private api: EcoCashAPI;

  constructor(config: { apiKey: string; merchantCode: string; mode: "sandbox" | "live" }) {
    this.api = new EcoCashAPI(config);
  }

  async initiatePayment(
    phoneNumber: string,
    amount: number,
    reference: string,
    description: string
  ): Promise<PaymentResult> {
    const result = await this.api.initPayment(phoneNumber, amount, description, reference);
    
    return {
      success: result.status !== "FAILED",
      status: result.status === "SUCCESS" ? "SUCCESS" : result.status === "PENDING_VALIDATION" ? "PENDING" : "FAILED",
      reference,
      providerReference: result.sourceReference,
      message: result.message,
    };
  }

  async lookupTransaction(reference: string): Promise<TransactionLookupResult> {
    const result = await this.api.lookupTransaction("", reference);
    
    return {
      success: result.paymentSuccess,
      status: result.status,
      amount: result.amount?.amount,
      currency: result.amount?.currency,
      reference: result.reference,
      providerReference: result.ecocashReference,
      timestamp: result.transactionDateTime,
    };
  }

  validatePhoneNumber(phone: string): boolean {
    return this.api.validatePhoneNumber(phone);
  }

  formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) return `263${digits.slice(1)}`;
    if (!digits.startsWith("263")) return `263${digits}`;
    return digits;
  }

  getProviderName(): string {
    return "EcoCash";
  }
}

export class MpesaAdapter implements WalletAdapter {
  private api: MpesaAPI;

  constructor(config: {
    consumerKey: string;
    consumerSecret: string;
    shortCode: string;
    passkey: string;
    environment: "sandbox" | "live";
  }) {
    this.api = new MpesaAPI(config);
  }

  async initiatePayment(
    phoneNumber: string,
    amount: number,
    reference: string,
    description: string
  ): Promise<PaymentResult> {
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/mpesa`;
    
    const result = await this.api.initiateSTKPush({
      phoneNumber,
      amount,
      reference,
      description,
      callbackUrl,
    });

    return {
      success: result.responseCode === "0",
      status: result.responseCode === "0" ? "SUCCESS" : "PENDING",
      reference,
      providerReference: result.checkoutRequestId,
      message: result.customerMessage,
    };
  }

  async lookupTransaction(reference: string): Promise<TransactionLookupResult> {
    const result = await this.api.querySTKStatus(reference);
    
    return {
      success: result.responseCode === "0",
      status: this.api.getStatusDescription(result.responseCode),
      providerReference: result.transactionReceipt,
      timestamp: result.transactionDate,
    };
  }

  validatePhoneNumber(phone: string): boolean {
    return this.api.validatePhoneNumber(phone);
  }

  formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) return `254${digits.slice(1)}`;
    if (digits.startsWith("+")) return digits.slice(1);
    if (!digits.startsWith("254")) return `254${digits}`;
    return digits;
  }

  getProviderName(): string {
    return "M-Pesa";
  }
}

export class MTNAdapter implements WalletAdapter {
  private api: MTNAPI;
  private countryCode: string;

  constructor(config: {
    apiKey: string;
    subscriptionKey: string;
    primaryKey: string;
    referenceId: string;
    environment: "sandbox" | "live";
    countryCode: string;
    currency: string;
  }) {
    this.api = new MTNAPI(config);
    this.countryCode = config.countryCode;
  }

  async initiatePayment(
    phoneNumber: string,
    amount: number,
    reference: string,
    description: string
  ): Promise<PaymentResult> {
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/mtn`;
    
    const result = await this.api.requestToPay({
      phoneNumber,
      amount,
      reference,
      description,
      callbackUrl,
    });

    return {
      success: result.status !== "FAILED",
      status: result.status === "PENDING" ? "PENDING" : result.status === "SUCCESS" ? "SUCCESS" : "FAILED",
      reference,
      providerReference: result.referenceId,
      message: result.message,
    };
  }

  async lookupTransaction(reference: string): Promise<TransactionLookupResult> {
    const result = await this.api.getTransactionStatus(reference);
    
    return {
      success: result.status === "SUCCESS",
      status: this.api.getStatusDescription(result.serviceStatus),
      amount: result.amount ? parseFloat(result.amount) : undefined,
      currency: result.currency,
      providerReference: reference,
      timestamp: result.modificationDate,
    };
  }

  validatePhoneNumber(phone: string): boolean {
    return this.api.validatePhoneNumber(phone);
  }

  formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) return `${this.countryCode}${digits.slice(1)}`;
    if (digits.startsWith("+")) return digits.slice(1);
    return digits;
  }

  getProviderName(): string {
    return "MTN Mobile Money";
  }
}

export class WalletAdapterFactory {
  static getAdapter(provider: WalletProvider): WalletAdapter {
    switch (provider) {
      case "ecocash":
        return new EcoCashAdapter({
          apiKey: process.env.ECOCASH_API_KEY || "",
          merchantCode: process.env.ECOCASH_MERCHANT_CODE || "",
          mode: process.env.NODE_ENV === "production" ? "live" : "sandbox",
        });
      
      case "mpesa":
        return new MpesaAdapter({
          consumerKey: process.env.MPESA_CONSUMER_KEY || "",
          consumerSecret: process.env.MPESA_CONSUMER_SECRET || "",
          shortCode: process.env.MPESA_SHORT_CODE || "",
          passkey: process.env.MPESA_PASSKEY || "",
          environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
        });
      
      case "mtn":
        return new MTNAdapter({
          apiKey: process.env.MTN_API_KEY || "",
          subscriptionKey: process.env.MTN_SUBSCRIPTION_KEY || "",
          primaryKey: process.env.MTN_PRIMARY_KEY || "",
          referenceId: process.env.MTN_REFERENCE_ID || "",
          environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
          countryCode: process.env.MTN_COUNTRY_CODE || "256",
          currency: process.env.MTN_CURRENCY || "USD",
        });
      
      default:
        throw new Error(`Unsupported wallet provider: ${provider}`);
    }
  }

  static getSupportedProviders(): WalletProvider[] {
    return ["ecocash", "mpesa", "mtn"];
  }

  static isProviderSupported(provider: string): boolean {
    return this.getSupportedProviders().includes(provider as WalletProvider);
  }
}
