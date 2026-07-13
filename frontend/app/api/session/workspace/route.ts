import { NextResponse } from 'next/server';

import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import { ensureGuestSession, updateSession } from '@/lib/server/mock-store';
import { parseJsonBody } from '@/lib/server/validate-payload';
import {
  applyGuestSessionCookie,
  resolveRequestSession,
} from '@/lib/server/resolve-request-session';

export async function PATCH(request: Request) {
  const body = await parseJsonBody<{ workspaceId: string | null }>(request);
  if (!body || !('workspaceId' in body)) {
    return jsonError('workspaceId is required', 400, 'BAD_REQUEST');
  }

  const session = await resolveRequestSession();

  if (session.isAuthenticated && session.accessToken) {
    const { data, errorMessage, response } = await callBackend<{ activeWorkspaceId: string | null }>(
      '/workspaces/active',
      {
        method: 'PATCH',
        body: JSON.stringify({ workspaceId: body.workspaceId }),
        accessToken: session.accessToken,
      },
    );

    if (!data) {
      return jsonError(
        errorMessage ?? 'Failed to set active workspace',
        response.status,
        'WORKSPACE_FAILED',
      );
    }

    return NextResponse.json({ activeWorkspaceId: data.activeWorkspaceId });
  }

  ensureGuestSession(session.sessionId);
  updateSession(session.sessionId, { activeWorkspaceId: body.workspaceId });

  const response = NextResponse.json({ activeWorkspaceId: body.workspaceId });
  if (session.guestId) {
    applyGuestSessionCookie(response, session.guestId, session.isNewGuest);
  }
  return response;
}
