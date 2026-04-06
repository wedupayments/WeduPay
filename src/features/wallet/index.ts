/**
 * Wallet feature barrel export
 *
 * Public API for the wallet feature module.
 * Import from here instead of reaching into sub-folders.
 */

// Component
export { FundWalletForm } from "./components/FundWalletForm";

// Service
export { WalletService } from "./services/wallet.service";

// Schemas
export { fundWalletSchema, updateWalletSchema } from "./schemas/wallet.schemas";
export type { FundWalletInput, UpdateWalletInput } from "./schemas/wallet.schemas";

// Types
export type { PaymentMethod, WalletSummary, FundWalletResult } from "./types/wallet.types";

// Constants
export { PAYMENT_METHODS, MOBILE_MONEY_IDS, isMobileMoney } from "./constants/payment-methods";
