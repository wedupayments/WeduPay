import {
  signInUser,
  signOutUser,
  registerUser,
  getCurrentSession,
  sendPasswordReset,
  updatePassword,
} from '@/lib/auth-service';
import type { LoginRequest, RegisterRequest } from '../types/auth.types';

export async function login({ email, password }: LoginRequest) {
  return signInUser({ email, password });
}

export async function register(req: RegisterRequest) {
  return registerUser(req);
}

export async function logout() {
  return signOutUser();
}

export async function fetchCurrentSession() {
  return getCurrentSession();
}

export async function requestPasswordReset(email: string) {
  return sendPasswordReset(email);
}

export async function changePassword(newPassword: string) {
  return updatePassword(newPassword);
}
