/**
 * Unified African Mobile Money Wallet Adapters
 * 
 * This module exports all wallet adapters for African mobile money providers.
 * 
 * Supported Regions:
 * - East Africa: Kenya (M-Pesa), Tanzania (M-Pesa, Tigo, Vodacom), Uganda (MTN, Airtel)
 * - West Africa: Nigeria (Paystack, Flutterwave, OPay, PalmPay), Ghana (Paystack, Flutterwave, MTN, Vodafone)
 * - Southern Africa: Zimbabwe (EcoCash, Telecel), Zambia (Airtel, Zamtel, MTN), Mozambique (M-Pesa, Halopesa)
 * - Central Africa: Cameroon (MTN, Orange), DRC (Orange, Airtel)
 * - Francophone West Africa: Senegal (Orange, Wave), Ivory Coast (Orange, Wave, MTN), Mali (Orange)
 */

// Existing adapters
export * from './mpesa.adapter';
export * from './ecocash.adapter';
export * from './mtn.adapter';
export * from './airtel.adapter';

// New adapters - East Africa
export * from '../../lib/mpesa-tanzania';
export * from '../../lib/tigo-pesa';

// New adapters - West Africa
export * from '../../lib/orange-money';
export * from '../../lib/wave';
export * from '../../lib/paystack';
export * from '../../lib/flutterwave';
export * from '../../lib/opay';
export * from '../../lib/palmpay';
export * from '../../lib/moov-money';

// New adapters - Southern Africa
export * from '../../lib/zamtel';
export * from '../../lib/telecel';
export * from '../../lib/halopesa';

// New adapters - Pan-African Aggregators
export * from '../../lib/africas-talking';
export * from '../../lib/pawapay';

// Wallet type enumeration
export enum WalletType {
  // East Africa
  MPESA = 'mpesa',
  MPESA_TANZANIA = 'mpesa_tanzania',
  TIGO_PESA = 'tigo_pesa',
  VODACOM_MPESA = 'vodacom_mpesa',
  AIRTEL = 'airtel',
  MTN = 'mtn',
  
  // Southern Africa
  ECOCASH = 'ecocash',
  TELECEL = 'telecel',
  ZAMTEL = 'zamtel',
  HALOPESA = 'halopesa',
  
  // West Africa - Anglophone
  PAYSTACK = 'paystack',
  FLUTTERWAVE = 'flutterwave',
  OPAY = 'opay',
  PALMPAY = 'palmpay',
  
  // West Africa - Francophone
  ORANGE_MONEY = 'orange_money',
  WAVE = 'wave',
  MOOV_MONEY = 'moov_money',
  
  // Pan-African Aggregators
  AFRICAS_TALKING = 'africas_talking',
  PAWAPAY = 'pawapay',
}

// Country to wallet providers mapping
export const COUNTRY_WALLETS: Record<string, WalletType[]> = {
  // East Africa
  KE: [WalletType.MPESA, WalletType.AIRTEL, WalletType.MTN],
  TZ: [WalletType.MPESA_TANZANIA, WalletType.TIGO_PESA, WalletType.AIRTEL, WalletType.MTN],
  UG: [WalletType.MTN, WalletType.AIRTEL],
  RW: [WalletType.PAWAPAY, WalletType.MTN, WalletType.AIRTEL],
  MW: [WalletType.PAWAPAY, WalletType.AIRTEL],
  
  // West Africa - Anglophone
  NG: [WalletType.PAWAPAY, WalletType.PAYSTACK, WalletType.FLUTTERWAVE, WalletType.OPAY, WalletType.PALMPAY],
  GH: [WalletType.PAWAPAY, WalletType.PAYSTACK, WalletType.FLUTTERWAVE, WalletType.MTN, WalletType.MOOV_MONEY],
  
  // West Africa - Francophone
  SN: [WalletType.ORANGE_MONEY, WalletType.WAVE],
  CI: [WalletType.ORANGE_MONEY, WalletType.WAVE, WalletType.MTN, WalletType.MOOV_MONEY],
  ML: [WalletType.ORANGE_MONEY, WalletType.WAVE],
  BF: [WalletType.ORANGE_MONEY, WalletType.WAVE],
  BJ: [WalletType.ORANGE_MONEY, WalletType.MOOV_MONEY],
  TG: [WalletType.MOOV_MONEY],
  NE: [WalletType.ORANGE_MONEY],
  
  // Southern Africa
  ZW: [WalletType.ECOCASH, WalletType.TELECEL],
  ZM: [WalletType.PAWAPAY, WalletType.AIRTEL, WalletType.ZAMTEL, WalletType.MTN],
  MZ: [WalletType.PAWAPAY, WalletType.MPESA, WalletType.HALOPESA],
  
  // Central Africa
  CM: [WalletType.MTN, WalletType.ORANGE_MONEY],
  CD: [WalletType.ORANGE_MONEY, WalletType.AIRTEL],
  GA: [WalletType.MOOV_MONEY],
  CF: [WalletType.MOOV_MONEY],
  TD: [WalletType.MOOV_MONEY],
};

// Wallet provider metadata
export const WALLET_METADATA: Record<WalletType, { name: string; region: string; countries: string[] }> = {
  // East Africa
  [WalletType.MPESA]: { name: 'M-Pesa Kenya', region: 'East Africa', countries: ['KE'] },
  [WalletType.MPESA_TANZANIA]: { name: 'M-Pesa Tanzania', region: 'East Africa', countries: ['TZ'] },
  [WalletType.TIGO_PESA]: { name: 'Tigo Pesa', region: 'East Africa', countries: ['TZ'] },
  [WalletType.VODACOM_MPESA]: { name: 'Vodacom M-Pesa', region: 'East Africa', countries: ['TZ'] },
  [WalletType.AIRTEL]: { name: 'Airtel Money', region: 'Pan-African', countries: ['KE', 'TZ', 'UG', 'ZM', 'CD', 'MW', 'RW'] },
  [WalletType.MTN]: { name: 'MTN Mobile Money', region: 'Pan-African', countries: ['UG', 'GH', 'CI', 'CM', 'ZM', 'RW', 'BJ'] },
  
  // Southern Africa
  [WalletType.ECOCASH]: { name: 'EcoCash', region: 'Southern Africa', countries: ['ZW'] },
  [WalletType.TELECEL]: { name: 'Telecel Cash', region: 'Southern Africa', countries: ['ZW'] },
  [WalletType.ZAMTEL]: { name: 'Zamtel Money', region: 'Southern Africa', countries: ['ZM'] },
  [WalletType.HALOPESA]: { name: 'Halopesa', region: 'Southern Africa', countries: ['MZ'] },
  
  // West Africa - Anglophone
  [WalletType.PAYSTACK]: { name: 'Paystack', region: 'West Africa', countries: ['NG', 'GH', 'KE', 'ZA'] },
  [WalletType.FLUTTERWAVE]: { name: 'Flutterwave', region: 'Pan-African', countries: ['NG', 'GH', 'KE', 'ZA', 'TZ', 'UG', 'RW', 'ZM', 'MW', 'ZW'] },
  [WalletType.OPAY]: { name: 'OPay', region: 'West Africa', countries: ['NG', 'EG'] },
  [WalletType.PALMPAY]: { name: 'PalmPay', region: 'West Africa', countries: ['NG', 'GH'] },
  
  // West Africa - Francophone
  [WalletType.ORANGE_MONEY]: { name: 'Orange Money', region: 'West/Central Africa', countries: ['SN', 'CI', 'ML', 'BF', 'CM', 'MG', 'BW', 'CD'] },
  [WalletType.WAVE]: { name: 'Wave', region: 'West Africa', countries: ['SN', 'CI', 'ML', 'BF'] },
  [WalletType.MOOV_MONEY]: { name: 'Moov Money', region: 'West/Central Africa', countries: ['BJ', 'TG', 'CI', 'NE', 'GA', 'CF', 'TD'] },
  
  // Pan-African Aggregators
  [WalletType.AFRICAS_TALKING]: { name: "Africa's Talking", region: 'Pan-African', countries: ['KE', 'UG', 'TZ', 'NG', 'GH'] },
  [WalletType.PAWAPAY]: { name: 'PawaPay', region: 'Pan-African', countries: ['BJ', 'BF', 'CM', 'CD', 'CG', 'CI', 'GA', 'GH', 'KE', 'MW', 'MZ', 'NG', 'RW', 'SN', 'SL', 'TZ', 'UG', 'ZM'] },
};

/**
 * Get supported wallets for a country
 */
export function getWalletsForCountry(countryCode: string): WalletType[] {
  return COUNTRY_WALLETS[countryCode.toUpperCase()] || [];
}

/**
 * Get wallet metadata
 */
export function getWalletMetadata(walletType: WalletType): { name: string; region: string; countries: string[] } | undefined {
  return WALLET_METADATA[walletType];
}

/**
 * Get all supported countries for a wallet
 */
export function getCountriesForWallet(walletType: WalletType): string[] {
  return WALLET_METADATA[walletType]?.countries || [];
}

/**
 * Check if wallet is available in country
 */
export function isWalletAvailableInCountry(walletType: WalletType, countryCode: string): boolean {
  const countries = getCountriesForWallet(walletType);
  return countries.includes(countryCode.toUpperCase());
}

// ============================================
// LEGACY ADAPTER INTERFACE (for backward compatibility)
// ============================================

import { MpesaAPI } from './mpesa.adapter';
import { EcoCashAPI } from './ecocash.adapter';
import { MTNAPI } from './mtn.adapter';
import { PawaPayAPI } from '../../lib/pawapay';

export type WalletProvider = "ecocash" | "mpesa" | "mtn" | "airtel" | "pawapay";

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

export class PawaPayAdapter implements WalletAdapter {
  private api: PawaPayAPI;

  constructor(config: { apiToken: string; baseUrl?: string; environment: "sandbox" | "live" }) {
    this.api = new PawaPayAPI(config);
  }

  async initiatePayment(
    phoneNumber: string,
    amount: number,
    reference: string,
    description: string
  ): Promise<PaymentResult> {
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/v1/webhooks/pawapay`;
    const result = await this.api.initiateDeposit({
      phoneNumber,
      amount,
      currency: process.env.PAWAPAY_CURRENCY || "USD",
      reference,
      description,
      callbackUrl,
    });

    return {
      success: result.status !== "FAILED",
      status: result.status,
      reference,
      providerReference: result.providerReference || result.transactionId,
      message: result.message,
    };
  }

  async lookupTransaction(reference: string): Promise<TransactionLookupResult> {
    const result = await this.api.getDepositStatus(reference);

    return {
      success: result.success,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      reference,
      providerReference: result.providerReference,
      timestamp: result.transactionDate,
    };
  }

  validatePhoneNumber(phone: string): boolean {
    return this.api.validatePhoneNumber(phone);
  }

  formatPhoneNumber(phone: string): string {
    return this.api.formatPhoneNumber(phone);
  }

  getProviderName(): string {
    return "PawaPay";
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

      case "pawapay":
        return new PawaPayAdapter({
          apiToken: process.env.PAWAPAY_API_TOKEN || "",
          baseUrl: process.env.PAWAPAY_BASE_URL,
          environment: process.env.PAWAPAY_MODE === "live" || process.env.NODE_ENV === "production" ? "live" : "sandbox",
        });

      default:
        throw new Error(`Unsupported wallet provider: ${provider}`);
    }
  }

  static getSupportedProviders(): WalletProvider[] {
    return ["ecocash", "mpesa", "mtn", "pawapay"];
  }

  static isProviderSupported(provider: string): boolean {
    return this.getSupportedProviders().includes(provider as WalletProvider);
  }
}
