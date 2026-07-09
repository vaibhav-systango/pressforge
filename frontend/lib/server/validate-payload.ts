import type { Campaign, ClientUser, Draft } from '@/lib/types';

export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function isClientUser(value: unknown): value is ClientUser {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.email === 'string' &&
    typeof v.workspaceId === 'string'
  );
}

export function isCampaign(value: unknown): value is Campaign {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === 'string' &&
    typeof v.workspaceId === 'string' &&
    typeof v.platform === 'string'
  );
}

export function isDraft(value: unknown): value is Draft {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === 'string' &&
    typeof v.workspaceId === 'string' &&
    typeof v.platform === 'string'
  );
}
