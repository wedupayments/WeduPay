/**
 * Auth feature barrel export
 */

// Hook — primary way to consume auth state in components
export { useAuth } from "./hooks/useAuth";

// Types
export type {
  UserProfile,
  SessionData,
  AuthContextData,
} from "./types/auth.types";

// Schemas — for form pages
export {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./schemas/auth.schemas";
export type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "./schemas/auth.schemas";
