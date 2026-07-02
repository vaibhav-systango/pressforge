'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { PageLoader } from '@/components/common/page-loader';
import { hasAuthTokens } from '@/lib/auth/token-storage';
import { hasSessionCookie } from '@/lib/auth/session-cookie';
import { useAuth } from '@/lib/hooks/queries/use-auth';

interface AuthRouteGuardProps {
  children: React.ReactNode;
}

export function AuthRouteGuard({ children }: AuthRouteGuardProps) {
  const router = useRouter();
  const { isLoading, user } = useAuth();

  useEffect(() => {
    if (!hasAuthTokens() && !hasSessionCookie()) {
      router.replace('/auth/login');
    }
  }, [router]);

  if (!hasAuthTokens() && !hasSessionCookie()) {
    return null;
  }

  if (isLoading && !user) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
