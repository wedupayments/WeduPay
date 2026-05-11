import { useState } from 'react';
import { updateProfile } from '../api/profile.api';
import { useAuth } from '@/shared/auth/AuthContext';
import { getErrorMessage } from '@/shared/utils/error';
import type { UpdateProfileRequest } from '../types/profile.types';

export function useUpdateProfile() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(data: UpdateProfileRequest) {
    if (!user?.id) { setError('Not authenticated'); return; }
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await updateProfile(user.id, data);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Update failed');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return { submit, isLoading, error, success, clear: () => { setError(null); setSuccess(false); } };
}
