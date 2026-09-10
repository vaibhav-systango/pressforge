'use client';

import { useQuery } from '@tanstack/react-query';

import type { MeUser } from '@/lib/auth/me-user';
import { hasSessionCookie } from '@/lib/auth/session-cookie';
import { hasAuthTokens } from '@/lib/auth/token-storage';
import { useMounted } from '@/lib/hooks/use-mounted';

interface MeResponse {
  user: MeUser;
}

export async function fetchMe(): Promise<MeResponse> {
  const res = await fetch('/api/me');
  if (!res.ok) throw new Error('Not authenticated');
  return res.json() as Promise<MeResponse>;
}

export function useAuth() {
  const mounted = useMounted();
  const hasSession = mounted && (hasSessionCookie() || hasAuthTokens());

  const query = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    retry: false,
    staleTime: 60 * 1000,
    enabled: hasSession,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return {
    ...query,
    user: query.data?.user,
    isAuthReady: mounted && (query.isFetched || query.isError || !hasSession),
  };
}
