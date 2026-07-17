'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { AppShell } from '@/components/layout/app-shell';
import { useAppState } from '@/lib/queries/use-app-state';
import { PageLoader } from '@/components/common/page-loader';

function isClientRouteAllowed(pathname: string): boolean {
  return (
    pathname === '/app' ||
    pathname.startsWith('/app/approvals') ||
    pathname.startsWith('/app/settings') ||
    pathname.startsWith('/app/workspaces') ||
    pathname.startsWith('/app/analytics') ||
    pathname.startsWith('/app/content/new') ||
    pathname.startsWith('/app/connect') ||
    (pathname.startsWith('/app/content/') &&
      pathname !== '/app/content' &&
      pathname !== '/app/content/')
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { state, isLoading } = useAppState();
  const pathname = usePathname();
  const router = useRouter();
  const isClient = state.currentUserType === 'client';
  const isAllowed = !isClient || isClientRouteAllowed(pathname);

  useEffect(() => {
    if (isLoading) return;
    if (!isAllowed) {
      router.replace('/app');
    }
  }, [isAllowed, isLoading, router]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAllowed) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
