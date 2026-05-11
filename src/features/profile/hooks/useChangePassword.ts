import { useState } from 'react';
import { changePassword } from '../api/profile.api';
import { getErrorMessage } from '@/shared/utils/error';
import type { ChangePasswordRequest } from '../types/profile.types';

export function useChangePassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit({ newPassword, confirmPassword }: ChangePasswordRequest) {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await changePassword(newPassword);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Password change failed');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return { submit, isLoading, error, success, clear: () => { setError(null); setSuccess(false); } };
}
