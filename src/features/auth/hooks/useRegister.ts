import { useState } from 'react';
import { register } from '../api/auth.api';
import { getErrorMessage } from '@/shared/utils/error';
import type { RegisterRequest } from '../types/auth.types';

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(data: RegisterRequest) {
    setIsLoading(true);
    setError(null);
    try {
      const result = await register(data);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return { submit, isLoading, error, success, clearError: () => setError(null) };
}
