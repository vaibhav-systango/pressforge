import { NextResponse } from 'next/server';

import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import { parseJsonBody } from '@/lib/server/validate-payload';
import { mapWorkspaceResponse, workspaceToCreateRequest } from '@/lib/workspaces/map-workspace';
import {
  applyGuestSessionCookie,
  resolveRequestSession,
} from '@/lib/server/resolve-request-session';
import type {
  CreateWorkspaceRequest,
  WorkspaceListResponse,
  WorkspaceResponse,
} from '@/lib/types/api';
import type { Workspace } from '@/lib/types';

function mapWorkspaceErrorStatus(status: number): string {
  if (status === 404) return 'WORKSPACE_NOT_FOUND';
  if (status === 403) return 'ACCESS_DENIED';
  if (status === 400) return 'BAD_REQUEST';
  return 'WORKSPACE_FAILED';
}

function buildCreatePayload(body: CreateWorkspaceRequest | Workspace) {
  return 'schedules' in body
    ? workspaceToCreateRequest(body)
    : {
        name: body.name,
        website: body.website,
        description: body.description,
        industry: body.industry,
        targetAudience: body.targetAudience,
        brandVoice: body.brandVoice,
        logoUrl: body.logoUrl,
        tone: body.tone,
        keywords: body.keywords ?? [],
        rules: body.rules ?? [],
      };
}

function guestSessionHeaders(guestId: string): HeadersInit {
  return { 'X-Guest-Session-Id': guestId };
}

export async function GET(request: Request) {
  const session = await resolveRequestSession();
  const clientId = new URL(request.url).searchParams.get('clientId');
  const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : '';

  if (session.isAuthenticated && session.accessToken) {
    const { data, errorMessage, response } = await callBackend<WorkspaceListResponse>(
      `/workspaces${query}`,
      { accessToken: session.accessToken },
    );

    if (!data) {
      return jsonError(
        errorMessage ?? 'Failed to fetch workspaces',
        response.status,
        mapWorkspaceErrorStatus(response.status),
      );
    }

    return NextResponse.json({
      workspaces: data.workspaces.map(mapWorkspaceResponse),
      activeWorkspaceId: data.activeWorkspaceId ?? null,
    });
  }

  if (!session.guestId) {
    return NextResponse.json({ workspaces: [], activeWorkspaceId: null });
  }

  const { data, errorMessage, response } = await callBackend<WorkspaceListResponse>(
    '/workspaces',
    { headers: guestSessionHeaders(session.guestId) },
  );

  if (!data) {
    return jsonError(
      errorMessage ?? 'Failed to fetch workspaces',
      response.status,
      mapWorkspaceErrorStatus(response.status),
    );
  }

  const jsonResponse = NextResponse.json({
    workspaces: data.workspaces.map(mapWorkspaceResponse),
    activeWorkspaceId: data.activeWorkspaceId ?? null,
  });
  applyGuestSessionCookie(jsonResponse, session.guestId, session.isNewGuest);
  return jsonResponse;
}

export async function POST(request: Request) {
  const body = await parseJsonBody<CreateWorkspaceRequest | Workspace>(request);
  if (!body?.name?.trim()) {
    return jsonError('Workspace name is required', 400, 'BAD_REQUEST');
  }

  const session = await resolveRequestSession();
  const payload = buildCreatePayload(body);

  if (session.isAuthenticated && session.accessToken) {
    const { data, errorMessage, response } = await callBackend<WorkspaceResponse>(
      '/workspaces',
      {
        method: 'POST',
        body: JSON.stringify(payload),
        accessToken: session.accessToken,
      },
    );

    if (!data) {
      return jsonError(
        errorMessage ?? 'Failed to create workspace',
        response.status,
        mapWorkspaceErrorStatus(response.status),
      );
    }

    return NextResponse.json({ workspace: mapWorkspaceResponse(data) }, { status: 201 });
  }

  if (!session.guestId) {
    return jsonError('Guest session unavailable', 500, 'GUEST_SESSION_FAILED');
  }

  const { data, errorMessage, response } = await callBackend<WorkspaceResponse>(
    '/workspaces',
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: guestSessionHeaders(session.guestId),
    },
  );

  if (!data) {
    return jsonError(
      errorMessage ?? 'Failed to create workspace',
      response.status,
      mapWorkspaceErrorStatus(response.status),
    );
  }

  const jsonResponse = NextResponse.json(
    { workspace: mapWorkspaceResponse(data) },
    { status: 201 },
  );
  applyGuestSessionCookie(jsonResponse, session.guestId, session.isNewGuest);
  return jsonResponse;
}
