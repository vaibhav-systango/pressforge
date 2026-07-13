import { cookies } from 'next/headers';

import { GUEST_SESSION_COOKIE } from '@/lib/server/auth/constants';
import { callBackend } from '@/lib/server/backend-client';
import {
  getGuestSessionIdFromCookie,
  clearGuestSessionCookie,
} from '@/lib/server/resolve-request-session';
import {
  getSessionState,
  sessionStore,
  updateSession,
} from '@/lib/server/mock-store';
import type { WorkspaceListResponse } from '@/lib/types/api';
import type { NextResponse } from 'next/server';

/** Claim guest workspaces in the backend after login or signup. */
export async function migrateGuestWorkspacesToBackend(
  accessToken: string,
  userId: string,
): Promise<string | null> {
  const cookieStore = await cookies();
  const guestId = cookieStore.get(GUEST_SESSION_COOKIE)?.value;
  if (!guestId) return null;

  let activeWorkspaceId: string | null = null;

  const { data } = await callBackend<WorkspaceListResponse>('/workspaces/claim-guest', {
    method: 'POST',
    body: JSON.stringify({ guestSessionId: guestId }),
    accessToken,
  });

  if (data) {
    activeWorkspaceId = data.activeWorkspaceId ?? data.workspaces[0]?.id ?? null;
  }

  const guestSessionId = getGuestSessionIdFromCookie(guestId);
  if (sessionStore.has(guestSessionId)) {
    const guestState = getSessionState(guestSessionId);
    updateSession(userId, (prev) => ({
      ...prev,
      accountType: prev.accountType || guestState.accountType || 'individual',
      individualNiche: guestState.individualNiche ?? prev.individualNiche,
      individualGoal: guestState.individualGoal ?? prev.individualGoal,
      individualThemes: guestState.individualThemes ?? prev.individualThemes,
      individualWebsite: guestState.individualWebsite ?? prev.individualWebsite,
      activeWorkspaceId: activeWorkspaceId ?? prev.activeWorkspaceId,
    }));
    sessionStore.delete(guestSessionId);
  }

  return activeWorkspaceId;
}

export function finalizeGuestMigrationResponse(response: NextResponse): NextResponse {
  return clearGuestSessionCookie(response);
}
