export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;
  phoneNumber: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  phoneNumber?: string;
  kycStatus?: string;
  avatarUrl?: string;
}

export interface AuthSession {
  accessToken: string;
  expiresAt: number;
  user: AuthUser;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}
