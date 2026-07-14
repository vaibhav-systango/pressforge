import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
import type { BackendUserResponse, WorkspaceListResponse } from '@/lib/types/api';
import type { AppState } from '@/lib/types';
import { ORGANIZATION_ID_COOKIE } from '@/lib/server/issue-backend-auth';

async function mergeBackendWorkspaces(state: AppState, accessToken: string): Promise<AppState> {
  const clientId = state.activeClientId;
  const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';
  const { data } = await callBackend<WorkspaceListResponse>(`/workspaces${query}`, { accessToken });
  if (!data) {
    return state;
  }

  return {
    ...state,
    workspaces: data.workspaces.map(mapWorkspaceResponse),
    activeWorkspaceId: data.activeWorkspaceId ?? state.activeWorkspaceId,
  };
}

async function mergeBackendProfile(state: AppState, accessToken: string, sessionId: string): Promise<AppState> {
  const { data } = await callBackend<BackendUserResponse>('/auth/me', { accessToken });
  if (!data) {
    return state;
  }

  const patch: Partial<AppState> = {
    currentUserName: data.fullName || state.currentUserName,
    currentUserEmail: data.email || state.currentUserEmail,
    ...(data.organizationName !== undefined && data.organizationName !== null
      ? { organizationName: data.organizationName }
      : {}),
  };

  updateSession(sessionId, patch);
  return { ...state, ...patch };
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

      let mergedState = await mergeBackendProfile(state, session.accessToken!, auth.sessionId);
      mergedState = await mergeBackendWorkspaces(mergedState, session.accessToken!);

      try {
        const cookieStore = await cookies();
        const orgId = cookieStore.get(ORGANIZATION_ID_COOKIE)?.value;
        const accessToken = session.accessToken;

        if (orgId && accessToken) {
          const { data: clientsData } = await callBackend<any[]>(
            `/organizations/${orgId}/clients`,
            {
              method: 'GET',
              accessToken,
            }
          );

          if (clientsData && Array.isArray(clientsData)) {
            const activeClients = clientsData
              .filter((c) => {
                const isExpired = c.status === 'expired' || (c.expiresAt && new Date(c.expiresAt) < new Date());
                return c.status === 'active' && !isExpired && c.role?.toUpperCase() === 'CLIENT';
              })
              .map((c, index) => {
                const ws = mergedState.workspaces.length > 0
                  ? mergedState.workspaces[index % mergedState.workspaces.length]
                  : undefined;
                return {
                  id: c.id,
                  name: c.name || c.fullName,
                  email: c.email,
                  status: 'active' as const,
                  role: c.role || 'CLIENT',
                  workspaceId: c.workspaceId || '',
                  workspaceIds: c.workspaceIds || (c.workspaceId ? [c.workspaceId] : []),
                };
              });

            mergedState.clients = activeClients;
            updateSession(auth.sessionId, { clients: activeClients });
          }
        }
      } catch (e) {
        console.error('Failed to sync backend clients to app state', e);
      }

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
