import { AuthRouteGuard } from '@/components/layout/auth-route-guard';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <AuthRouteGuard>{children}</AuthRouteGuard>;
}
