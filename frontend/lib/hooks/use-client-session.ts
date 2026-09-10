'use client';

import { hasSessionCookie } from '@/lib/auth/session-cookie';
import { hasAuthTokens } from '@/lib/auth/token-storage';
import { useMounted } from '@/lib/hooks/use-mounted';

/** Session indicators that are only readable in the browser after hydration. */
export function useClientSession(): boolean {
  const mounted = useMounted();
  if (!mounted) return false;
  return hasAuthTokens() || hasSessionCookie();
}
