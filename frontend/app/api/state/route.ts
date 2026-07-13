import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { ApiError, withAuth } from '@/lib/server/auth/with-auth';
import { ensureSession, resetSession, updateSession } from '@/lib/server/mock-store';
import { parseJsonBody } from '@/lib/server/validate-payload';
import type { AppState } from '@/lib/types';
import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { callBackend } from '@/lib/server/backend-client';
import { ORGANIZATION_ID_COOKIE } from '@/lib/server/issue-backend-auth';

export async function GET() {
  const result = await withAuth(async (auth) => {
    const state = ensureSession(auth.sessionId, {
      userId: auth.userId,
      userType: auth.userType,
      email: auth.email,
      name: auth.email,
    });

    try {
      const cookieStore = await cookies();
      const orgId = cookieStore.get(ORGANIZATION_ID_COOKIE)?.value;
      const accessToken = await getAccessToken();

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
              return c.status === 'active' && !isExpired;
            })
            .map((c, index) => {
              const ws = state.workspaces[index % state.workspaces.length];
              return {
                id: c.id,
                name: c.name || c.fullName,
                email: c.email,
                status: 'active' as const,
                role: c.role || 'Client Reviewer',
                workspaceId: c.workspaceId || ws?.id || '',
              };
            });

          state.clients = activeClients;
          updateSession(auth.sessionId, { clients: activeClients });
        }
      }
    } catch (e) {
      console.error('Failed to sync backend clients to app state', e);
    }

    return { state };
  });

  if (result instanceof NextResponse) {
    return result;
  }

  return NextResponse.json(result);
}

export async function PATCH(request: Request) {
  const body = await parseJsonBody<{ merge?: Partial<AppState> }>(request);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

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
    const state = updateSession(auth.sessionId, (prev) => ({ ...prev, ...body.merge }));
    return { state };
  });

  if (result instanceof NextResponse) {
    return result;
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await parseJsonBody<{ action?: string }>(request);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const result = await withAuth(async (auth) => {
    if (body.action === 'reset') {
      const state = resetSession(auth.sessionId);
      return { state };
    }
    throw new ApiError('Unknown action', 400, 'BAD_REQUEST');
  });

  if (result instanceof NextResponse) {
    return result;
  }

  return NextResponse.json(result);
}
