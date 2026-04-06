/**
 * Supported payment methods for wallet funding.
 *
 * Extracted from FundWalletForm.tsx where it was previously defined inline.
 * Single source of truth for both the UI and validation logic.
 */

import type { PaymentMethod } from "../types/wallet.types";

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "mpesa",
    name: "M-Pesa",
    icon: "phone_iphone",
    currencies: ["KES", "USD"],
    minAmount: 10,
    maxAmount: 150_000,
    fee: 0,
  },
  {
    id: "airtel",
    name: "Airtel Money",
    icon: "phone_iphone",
    currencies: ["KES", "UGX", "ZMW"],
    minAmount: 10,
    maxAmount: 100_000,
    fee: 0,
  },
  {
    id: "mtn",
    name: "MTN Mobile Money",
    icon: "phone_iphone",
    currencies: ["UGX", "GHS", "XOF"],
    minAmount: 1_000,
    maxAmount: 5_000_000,
    fee: 0,
  },
  {
    id: "flutterwave",
    name: "Card / Bank",
    icon: "credit_card",
    currencies: ["NGN", "GHS", "KES", "USD"],
    minAmount: 100,
    maxAmount: 1_000_000,
    fee: 1.5,
  },
];

export const MOBILE_MONEY_IDS = new Set(["mpesa", "airtel", "mtn"]);

export const isMobileMoney = (methodId: string): boolean =>
  MOBILE_MONEY_IDS.has(methodId);
