'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { PageLoader } from '@/components/common/page-loader';
import { useAuth } from '@/lib/hooks/queries/use-auth';
import { useClientSession } from '@/lib/hooks/use-client-session';
import { useMounted } from '@/lib/hooks/use-mounted';

interface AuthRouteGuardProps {
  children: React.ReactNode;
}

export function AuthRouteGuard({ children }: AuthRouteGuardProps) {
  const router = useRouter();
  const mounted = useMounted();
  const hasSession = useClientSession();
  const { user, isError, isAuthReady } = useAuth();

  useEffect(() => {
    if (!mounted || !isAuthReady) return;

    if (!hasSession) {
      router.replace('/auth/login');
    }
  }, [mounted, isAuthReady, hasSession, router]);

  useEffect(() => {
    if (!mounted || !hasSession || !isAuthReady || !isError) return;

    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      router.replace('/auth/login');
    });
  }, [mounted, hasSession, isAuthReady, isError, router]);

  if (!mounted || !isAuthReady) {
    return <PageLoader />;
  }

  if (!hasSession || (isError && !user)) {
    return <PageLoader />;
  }

  return <>{children}</>;
}
