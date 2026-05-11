/**
 * Custom hook for making authenticated API calls
 * Automatically waits for auth to initialize before making requests
 */

import { useAuth } from '@/shared/auth/AuthContext';
import { useCallback } from 'react';

export function useAuthenticatedFetch() {
  const { isInitialized, isLoading, session } = useAuth();

  const authenticatedFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      // Wait for auth to be ready
      if (!isInitialized || isLoading) {
        throw new Error('Authentication not initialized');
      }

      if (!session) {
        throw new Error('Not authenticated');
      }

      // Make the fetch request - cookies are automatically included
      return fetch(input, {
        ...init,
        credentials: 'same-origin', // Ensure cookies are sent
      });
    },
    [isInitialized, isLoading, session]
  );

  return {
    fetch: authenticatedFetch,
    isReady: isInitialized && !isLoading && !!session,
  };
}
