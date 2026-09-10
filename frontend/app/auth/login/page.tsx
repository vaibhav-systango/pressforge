import { Suspense } from 'react';
import { LoginView } from '@/features/auth/login-view';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginView />
    </Suspense>
  );
}
