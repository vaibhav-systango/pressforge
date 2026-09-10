import { Suspense } from 'react';
import { AcceptInviteView } from '@/features/auth/accept-invite-view';
import { PageLoader } from '@/components/common/page-loader';

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AcceptInviteView />
    </Suspense>
  );
}
