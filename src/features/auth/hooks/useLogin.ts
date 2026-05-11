import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../api/auth.api';
import { getDashboardPathForUser } from '@/lib/auth-service';
import { getErrorMessage } from '@/shared/utils/error';
import type { LoginRequest } from '../types/auth.types';

export function useLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(data: LoginRequest, redirectTo?: string) {
    setIsLoading(true);
    setError(null);
    try {
      const result = await login(data);
      if (result.success && result.user) {
        const target = redirectTo || getDashboardPathForUser(result.user);
        router.replace(target);
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return { submit, isLoading, error, clearError: () => setError(null) };
}
