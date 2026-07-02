'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { AppShell } from '@/components/layout/app-shell';
import { useAppState } from '@/lib/queries/use-app-state';

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
  const { state } = useAppState();
  const pathname = usePathname();
  const router = useRouter();
  const isClient = state.currentUserType === 'client';
  const isAllowed = !isClient || isClientRouteAllowed(pathname);

  useEffect(() => {
    if (!isAllowed) {
      router.replace('/app');
    }
  }, [isAllowed, router]);

  if (!isAllowed) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
