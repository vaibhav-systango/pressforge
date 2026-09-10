import { Suspense } from 'react';
import { WorkspacesView } from '@/features/workspaces/workspaces-view';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <WorkspacesView />
    </Suspense>
  );
}
