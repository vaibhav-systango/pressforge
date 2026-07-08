import { AppLayout } from '@/components/layout/app-layout';
import { AuthRouteGuard } from '@/components/layout/auth-route-guard';
import { OnboardingStatusGuard } from '@/components/layout/onboarding-status-guard';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthRouteGuard>
      <OnboardingStatusGuard mode="app">
        <AppLayout>{children}</AppLayout>
      </OnboardingStatusGuard>
    </AuthRouteGuard>
  );
}
