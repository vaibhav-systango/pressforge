import { NextResponse } from 'next/server';

import { ApiError, jsonError, withAuth } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import {
  ensureGuestSession,
  ensureSession,
  getSessionState,
  resetSession,
  updateSession,
} from '@/lib/server/mock-store';
import { parseJsonBody } from '@/lib/server/validate-payload';
import { mapWorkspaceResponse } from '@/lib/workspaces/map-workspace';
import {
  applyGuestSessionCookie,
  resolveRequestSession,
} from '@/lib/server/resolve-request-session';
import type { WorkspaceListResponse } from '@/lib/types/api';
import type { AppState } from '@/lib/types';

async function mergeBackendWorkspaces(state: AppState, accessToken: string): Promise<AppState> {
  const { data } = await callBackend<WorkspaceListResponse>('/workspaces', { accessToken });
  if (!data) {
    return state;
  }

  return {
    ...state,
    workspaces: data.workspaces.map(mapWorkspaceResponse),
    activeWorkspaceId: data.activeWorkspaceId ?? state.activeWorkspaceId,
  };
}

export async function GET() {
  const session = await resolveRequestSession();

  if (session.isAuthenticated && session.accessToken) {
    const result = await withAuth(async (auth) => {
      const state = ensureSession(auth.sessionId, {
        userId: auth.userId,
        userType: auth.userType,
        email: auth.email,
        name: auth.email,
      });
      const mergedState = await mergeBackendWorkspaces(state, session.accessToken!);
      return { state: mergedState };
    });

    if (result instanceof NextResponse) return result;
    return NextResponse.json(result);
  }

  ensureGuestSession(session.sessionId);
  const state = getSessionState(session.sessionId);
  const response = NextResponse.json({ state });
  if (session.guestId) {
    applyGuestSessionCookie(response, session.guestId, session.isNewGuest);
  }
  return response;
}

export async function PATCH(request: Request) {
  const body = await parseJsonBody<{ merge?: Partial<AppState> }>(request);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const session = await resolveRequestSession();

  if (session.isAuthenticated && session.accessToken) {
    const result = await withAuth(async (auth) => {
      ensureSession(auth.sessionId, {
        userId: auth.userId,
        userType: auth.userType,
        email: auth.email,
        name: auth.email,
      });
      if (!body.merge) {
        return NextResponse.json({ error: 'merge required', code: 'BAD_REQUEST' }, { status: 400 });
      }

      const { workspaces: _workspaces, activeWorkspaceId: _activeWorkspaceId, ...sessionMerge } =
        body.merge;

      const state = updateSession(auth.sessionId, (prev) => ({ ...prev, ...sessionMerge }));
      const mergedState = await mergeBackendWorkspaces(state, session.accessToken!);
      return { state: mergedState };
    });

    if (result instanceof NextResponse) return result;
    return NextResponse.json(result);
  }

  if (!body.merge) {
    return NextResponse.json({ error: 'merge required', code: 'BAD_REQUEST' }, { status: 400 });
  }

  ensureGuestSession(session.sessionId);
  const { workspaces: _workspaces, activeWorkspaceId: _activeWorkspaceId, ...sessionMerge } =
    body.merge;
  const state = updateSession(session.sessionId, (prev) => ({ ...prev, ...sessionMerge }));
  const response = NextResponse.json({ state });
  if (session.guestId) {
    applyGuestSessionCookie(response, session.guestId, session.isNewGuest);
  }
  return response;
}

export async function POST(request: Request) {
  const body = await parseJsonBody<{ action?: string }>(request);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const session = await resolveRequestSession();

  if (session.isAuthenticated) {
    const result = await withAuth(async (auth) => {
      if (body.action === 'reset') {
        const state = resetSession(auth.sessionId);
        if (session.accessToken) {
          const mergedState = await mergeBackendWorkspaces(state, session.accessToken);
          return { state: mergedState };
        }
        return { state };
      }
      throw new ApiError('Unknown action', 400, 'BAD_REQUEST');
    });

    if (result instanceof NextResponse) return result;
    return NextResponse.json(result);
  }

  if (body.action === 'reset') {
    ensureGuestSession(session.sessionId);
    const state = resetSession(session.sessionId);
    const response = NextResponse.json({ state });
    if (session.guestId) {
      applyGuestSessionCookie(response, session.guestId, session.isNewGuest);
    }
    return response;
  }

  return jsonError('Unknown action', 400, 'BAD_REQUEST');
}
