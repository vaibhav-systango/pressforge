import { AppLayout } from '@/components/layout/app-layout';
import { AuthRouteGuard } from '@/components/layout/auth-route-guard';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthRouteGuard>
      <AppLayout>{children}</AppLayout>
    </AuthRouteGuard>
  );
}
