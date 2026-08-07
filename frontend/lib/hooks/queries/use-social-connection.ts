'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { SocialConnectionResponse } from '@/app/api/social/[platform]/connection/route';

const OAUTH_RETURN_TO_KEY = 'socialOAuthReturnTo';

async function fetchSocialConnection(platform: string): Promise<SocialConnectionResponse> {
  const res = await fetch(`/api/social/${platform}/connection`);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Failed to fetch ${platform} connection`);
  }
  return res.json() as Promise<SocialConnectionResponse>;
}

async function startSocialConnect(platform: string): Promise<{ authorizationUrl: string }> {
  const res = await fetch(`/api/social/${platform}/connect`);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Failed to start ${platform} connect`);
  }
  return res.json() as Promise<{ authorizationUrl: string }>;
}

async function disconnectSocialAccount(platform: string): Promise<void> {
  const res = await fetch(`/api/social/${platform}/connection`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Failed to disconnect ${platform}`);
  }
}

function sanitizeAccountLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.trim();
  if (!cleaned || /undefined/i.test(cleaned)) return null;
  return cleaned;
}

export function useSocialConnection(platform: string) {
  const queryClient = useQueryClient();
  const queryKey = ['social-connection', platform];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchSocialConnection(platform),
    staleTime: 30 * 1000,
  });

  const connectMutation = useMutation({
    mutationFn: () => startSocialConnect(platform),
    onSuccess: (data) => {
      window.location.href = data.authorizationUrl;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => disconnectSocialAccount(platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['social-connection', platform] }),
    [platform, queryClient],
  );

  const connect = (returnTo?: string) => {
    if (returnTo) {
      sessionStorage.setItem(OAUTH_RETURN_TO_KEY, returnTo);
    }
    connectMutation.mutate();
  };

  const disconnect = () => {
    if (!query.data?.connected) {
      return;
    }
    disconnectMutation.mutate();
  };

  const accountName =
    sanitizeAccountLabel(query.data?.account?.displayName) ??
    sanitizeAccountLabel(query.data?.account?.username);

  return {
    connection: query.data,
    accountName,
    isLoading: query.isLoading,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    connectError: connectMutation.error,
    disconnectError: disconnectMutation.error,
    connect,
    disconnect,
    refresh,
  };
}

export function consumeSocialOAuthReturnTo(): string | null {
  if (typeof window === 'undefined') return null;
  const returnTo = sessionStorage.getItem(OAUTH_RETURN_TO_KEY);
  if (returnTo) {
    sessionStorage.removeItem(OAUTH_RETURN_TO_KEY);
  }
  return returnTo;
}

export function useLinkedInConnection() {
  const result = useSocialConnection('linkedin');
  return {
    ...result,
    connectLinkedIn: result.connect,
    disconnectLinkedIn: result.disconnect,
  };
}

export function useInstagramConnection() {
  const result = useSocialConnection('instagram');
  return {
    ...result,
    connectInstagram: result.connect,
    disconnectInstagram: result.disconnect,
  };
}
