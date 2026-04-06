/**
 * Wallet Zod schemas
 *
 * Single source of truth for wallet-related validation.
 * Used by both the API route handler and the FundWalletForm component.
 */

import { z } from "zod";

export const fundWalletSchema = z.object({
  currency: z.string().length(3, "Currency must be a 3-letter ISO code"),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be positive"),
  source: z.enum(["mobile_money", "card", "bank_transfer"], {
    errorMap: () => ({ message: "Invalid payment source" }),
  }),
  sourceReference: z.string().optional(),
  description: z.string().optional(),
  walletId: z.string().optional(),
  phoneNumber: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.source === "mobile_money" && !data.phoneNumber) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["phoneNumber"],
      message: "Phone number is required for mobile money payments",
    });
  }
});

export type FundWalletInput = z.infer<typeof fundWalletSchema>;

// ─── Wallet update schema ──────────────────────────────────────────────────────

export const updateWalletSchema = z.object({
  nickname: z.string().max(50, "Nickname must be 50 characters or fewer"),
});

export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;
