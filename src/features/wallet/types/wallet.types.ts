/**
 * Wallet domain types
 *
 * Types used across wallet components, hooks, and services.
 * API response shapes are modelled here so they can be shared with the route.
 */

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  currencies: string[];
  minAmount: number;
  maxAmount: number;
  /** Fee as a percentage, e.g. 1.5 = 1.5% */
  fee: number;
}

export interface WalletSummary {
  id: string;
  walletType: string;
  currency: string;
  balance: number;
  nickname?: string | null;
}

export interface FundWalletResult {
  success: boolean;
  walletId?: string;
  previousBalance?: number;
  newBalance?: number;
  transactionId?: string;
  error?: string;
  errorCode?: string;
}
