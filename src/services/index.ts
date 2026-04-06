/**
 * @deprecated Import services from their feature modules instead:
 *   WalletService  → "@/features/wallet"
 *   PaymentService → "@/features/payments"
 *   TransferService → "@/features/transfers"
 *   LedgerService / RefundService → "@/features/payments"
 *
 * This file is a backward-compatibility shim.
 * New code must NOT be added here.
 */

// Re-export from feature modules so existing imports keep working
export { WalletService } from "@/features/wallet";
export { PaymentService, LedgerService, RefundService } from "@/features/payments";
export type {
  TransactionStatus,
  TransactionType,
  CreateTransactionInput,
} from "@/features/payments";
export { TransferService } from "@/features/transfers";
export type { TransferInput } from "@/features/transfers";

import { WalletService } from "@/features/wallet";
import { PaymentService, LedgerService, RefundService } from "@/features/payments";
import { TransferService } from "@/features/transfers";

export const paymentService = new PaymentService();
export const walletService = new WalletService();
export const transferService = new TransferService();
export const ledgerService = new LedgerService();
export const refundService = new RefundService();
