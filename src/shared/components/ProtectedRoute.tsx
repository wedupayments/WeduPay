'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/auth/AuthContext';
import { PageSpinner } from '@/shared/components/ui/Spinner';
import type { UserRole } from '@/shared/types/common.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/auth/login',
}: ProtectedRouteProps) {
  const { session, user, isLoading, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized || isLoading) return;
    if (!session || !user) {
      router.replace(redirectTo);
      return;
    }
    if (requiredRole && user.role !== requiredRole) {
      router.replace('/dashboard');
    }
  }, [isInitialized, isLoading, session, user, requiredRole, redirectTo, router]);

  if (!isInitialized || isLoading) return <PageSpinner label="Loading..." />;
  if (!session || !user) return <PageSpinner />;

  return <>{children}</>;
}
