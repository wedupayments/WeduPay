import { useAuth } from '@/shared/auth/AuthContext';

export function useSession() {
  const { session, user, isLoading, isInitialized } = useAuth();

  return {
    session,
    user,
    isLoading,
    isInitialized,
    isAuthenticated: !!session && !!user,
  };
}
