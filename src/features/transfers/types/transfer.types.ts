/**
 * Transfer domain types
 *
 * Shared between transfer components, hooks, and the API layer.
 */

export type TransferStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED";

export interface TransferQuote {
  sendAmount: number;
  sendCurrency: string;
  receiveAmount: number;
  receiveCurrency: string;
  exchangeRate: number;
  transferFee: number;
  fxFee: number;
  totalFees: number;
  totalDebit: number;
  routingProvider: string;
  expiresAt: string;
}

export interface TransferRecipient {
  id: string;
  name: string;
  phoneNumber: string;
  country: string;
  walletType: string;
  isVerified: boolean;
  lastUsedAt?: string | null;
}

export interface P2PTransferSummary {
  transferRef: string;
  senderPhone: string;
  recipientPhone: string;
  recipientName?: string | null;
  sendAmount: number;
  sendCurrency: string;
  receiveAmount: number;
  receiveCurrency: string;
  totalFees: number;
  status: TransferStatus;
  createdAt: string;
}
