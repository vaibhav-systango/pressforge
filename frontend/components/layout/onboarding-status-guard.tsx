'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { PageLoader } from '@/components/common/page-loader';
import { useAuth } from '@/lib/hooks/queries/use-auth';

interface OnboardingStatusGuardProps {
  children: React.ReactNode;
  mode: 'app' | 'onboarding';
}

export function OnboardingStatusGuard({ children, mode }: OnboardingStatusGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  const onboardingCompleted = user?.onboardingStatus === 'COMPLETED';

  useEffect(() => {
    if (!user) return;

    if (mode === 'onboarding' && onboardingCompleted) {
      router.replace('/app');
      return;
    }

    if (mode === 'app' && !onboardingCompleted) {
      router.replace('/onboarding/organization');
    }
  }, [user, onboardingCompleted, mode, router, pathname]);

  if (isLoading && !user) {
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
