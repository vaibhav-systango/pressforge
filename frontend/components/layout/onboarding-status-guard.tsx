'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { PageLoader } from '@/components/common/page-loader';
import { isOnboardingComplete } from '@/lib/auth/redirect';
import { useAuth } from '@/lib/hooks/queries/use-auth';
import { useMounted } from '@/lib/hooks/use-mounted';

interface OnboardingStatusGuardProps {
  children: React.ReactNode;
  mode: 'app' | 'onboarding';
}

export function OnboardingStatusGuard({ children, mode }: OnboardingStatusGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useMounted();
  const { user, isAuthReady } = useAuth();

  const onboardingCompleted = isOnboardingComplete(user);

  useEffect(() => {
    if (!mounted || !user) return;

    if (mode === 'onboarding' && onboardingCompleted) {
      router.replace('/app');
      return;
    }

    if (mode === 'app' && !onboardingCompleted) {
      router.replace('/onboarding/organization');
    }
  }, [mounted, user, onboardingCompleted, mode, router, pathname]);

  if (!mounted || !isAuthReady) {
    return <PageLoader />;
  }

  if (user) {
    if (mode === 'onboarding' && onboardingCompleted) {
      return null;
    }
    if (mode === 'app' && !onboardingCompleted) {
      return null;
    }
  }

  return <>{children}</>;
}
