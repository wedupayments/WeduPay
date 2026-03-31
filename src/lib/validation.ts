import { z } from "zod";

export const WALLET_PROVIDERS = ["ecocash", "mpesa", "mtn", "airtel"] as const;
export const CURRENCIES = ["USD", "EUR", "KES", "ZAR", "ZWL", "ZiG"] as const;
export const TRANSACTION_TYPES = ["PAYMENT", "TRANSFER", "WITHDRAWAL", "DEPOSIT"] as const;
export const TRANSACTION_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const;
export const USER_ROLES = ["USER", "ADMIN", "MERCHANT"] as const;
export const KYC_STATUSES = ["pending", "verified", "rejected"] as const;
export type WalletProvider = typeof WALLET_PROVIDERS[number];

export const phoneSchema = z.string()
  .min(9, "Phone number must be at least 9 digits")
  .max(12, "Phone number must not exceed 12 digits")
  .regex(/^[\d\s+()-]+$/, "Invalid phone number format");

export const amountSchema = z.number()
  .positive("Amount must be positive")
  .max(100000, "Amount exceeds maximum limit of 100,000");

export const currencySchema = z.enum(CURRENCIES);

export const paymentSchema = z.object({
  walletType: z.enum(WALLET_PROVIDERS),
  phoneNumber: phoneSchema,
  amount: amountSchema,
  currency: currencySchema.optional().default("USD"),
  description: z.string().max(255, "Description too long").optional(),
});

export const transferSchema = z.object({
  sourceWalletType: z.enum(WALLET_PROVIDERS),
  destinationWalletType: z.enum(WALLET_PROVIDERS),
  destinationPhone: phoneSchema,
  amount: amountSchema,
  currency: currencySchema.optional().default("USD"),
  description: z.string().max(255).optional(),
});

export const walletSchema = z.object({
  walletType: z.enum(WALLET_PROVIDERS),
  currency: currencySchema.optional().default("USD"),
});

export const cardSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  currency: currencySchema.optional().default("USD"),
  limit: z.number().positive().max(50000).optional(),
});

export const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  phoneNumber: phoneSchema,
  country: z.string().min(2, "Country code required").max(3),
  role: z.enum(USER_ROLES).optional().default("USER"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  phoneNumber: phoneSchema,
  country: z.string().min(2).max(3),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const waitlistSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100).optional(),
  type: z.enum(["MERCHANT", "STUDENT"]),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  status: z.enum(TRANSACTION_STATUSES).optional(),
});

export const idSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

export const referenceSchema = z.object({
  reference: z.string().min(1, "Reference is required"),
});

export const webhookPayloadSchema = z.object({
  transactionId: z.string().optional(),
  reference: z.string().optional(),
  status: z.string(),
  amount: z.number().optional(),
  phoneNumber: z.string().optional(),
  provider: z.string().optional(),
  timestamp: z.string().optional(),
});

export const apiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  permissions: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type WalletInput = z.infer<typeof walletSchema>;
export type CardInput = z.infer<typeof cardSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type WaitlistInput = z.infer<typeof waitlistSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
export type ApiKeyInput = z.infer<typeof apiKeySchema>;

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      code: "VALIDATION_ERROR",
      target: issue.path.join("."),
      message: issue.message,
    }));
    
    return {
      success: false,
      errors,
      data: null,
    };
  }
  
  return {
    success: true,
    errors: null,
    data: result.data,
  };
}

export function formatZodError(error: z.ZodError): Array<{ code: string; target: string; message: string }> {
  return error.issues.map((issue) => ({
    code: "VALIDATION_ERROR",
    target: issue.path.join("."),
    message: issue.message,
  }));
}
