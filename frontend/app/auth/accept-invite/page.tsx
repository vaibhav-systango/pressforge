import { Suspense } from 'react';
import { AcceptInviteView } from '@/features/auth/accept-invite-view';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteView />
    </Suspense>
  );
}
