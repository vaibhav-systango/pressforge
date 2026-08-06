'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';
import { PageLoader } from '@/components/common/page-loader';
import { useAuth } from '@/lib/hooks/queries/use-auth';
import { useClientSession } from '@/lib/hooks/use-client-session';
import { useMounted } from '@/lib/hooks/use-mounted';
import { clearAccessToken } from '@/lib/auth/token-storage';

interface AuthRouteGuardProps {
  children: React.ReactNode;
}

export function AuthRouteGuard({ children }: AuthRouteGuardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mounted = useMounted();
  const hasSession = useClientSession();
  const { user, isError, isAuthReady } = useAuth();

  useEffect(() => {
    if (!mounted || !isAuthReady) return;

    if (!hasSession) {
      clearAccessToken();
      queryClient.clear();
      router.replace('/auth/login');
    }
  }, [mounted, isAuthReady, hasSession, router, queryClient]);

  useEffect(() => {
    if (!mounted || !hasSession || !isAuthReady || !isError) return;

    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      clearAccessToken();
      queryClient.clear();
      window.location.href = '/auth/login';
    });
  }, [mounted, hasSession, isAuthReady, isError, queryClient]);

  if (!mounted || !isAuthReady) {
    return <PageLoader />;
  }

  if (!hasSession || (isError && !user)) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
