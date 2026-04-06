/**
 * Transfer Zod schemas — single source of truth for validation.
 * Used by both the P2PTransferForm component and the API route handler.
 */

import { z } from "zod";

export const transferQuoteSchema = z.object({
  senderPhone: z
    .string()
    .min(1, "Sender phone is required")
    .regex(/^\+?[1-9]\d{8,14}$/, "Use international format (e.g. +254712345678)"),
  senderCountry: z.string().length(2, "Must be a 2-letter country code"),
  senderWalletType: z.string().min(1, "Wallet type required"),
  recipientPhone: z
    .string()
    .min(1, "Recipient phone is required")
    .regex(/^\+?[1-9]\d{8,14}$/, "Use international format"),
  recipientCountry: z.string().length(2, "Must be a 2-letter country code"),
  recipientWalletType: z.string().min(1, "Wallet type required"),
  sendAmount: z.number().positive("Amount must be positive"),
  sendCurrency: z.string().length(3, "Must be a 3-letter currency code"),
});

export type TransferQuoteInput = z.infer<typeof transferQuoteSchema>;

export const initiateTransferSchema = transferQuoteSchema.extend({
  quoteId: z.string().optional(),
  description: z.string().optional(),
});

export type InitiateTransferInput = z.infer<typeof initiateTransferSchema>;
