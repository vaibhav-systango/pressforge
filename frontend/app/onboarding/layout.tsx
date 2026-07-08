import { AuthRouteGuard } from '@/components/layout/auth-route-guard';
import { OnboardingStatusGuard } from '@/components/layout/onboarding-status-guard';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthRouteGuard>
      <OnboardingStatusGuard mode="onboarding">{children}</OnboardingStatusGuard>
    </AuthRouteGuard>
  );
}
