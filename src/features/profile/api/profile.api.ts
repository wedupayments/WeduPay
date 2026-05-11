import { updateUserProfile, updatePassword } from '@/lib/auth-service';
import type { UpdateProfileRequest } from '../types/profile.types';

export async function updateProfile(userId: string, data: UpdateProfileRequest) {
  return updateUserProfile(userId, data);
}

export async function changePassword(newPassword: string) {
  return updatePassword(newPassword);
}
