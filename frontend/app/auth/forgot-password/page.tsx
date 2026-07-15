import { Suspense } from 'react';
import { ForgotPasswordView } from '@/features/auth/forgot-password-view';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordView />
    </Suspense>
  );
}
