import { NextResponse } from 'next/server';

import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import { isDraft, parseJsonBody } from '@/lib/server/validate-payload';
import type { Draft } from '@/lib/types';

type DraftResponse = Draft;
type DraftListResponse = { drafts: Draft[] };

function mapDraftError(status: number): string {
  if (status === 404) return 'NOT_FOUND';
  if (status === 403) return 'ACCESS_DENIED';
  if (status === 400) return 'BAD_REQUEST';
  return 'DRAFT_FAILED';
}

export async function GET(request: Request) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const workspaceId = new URL(request.url).searchParams.get('workspaceId');
  const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';

  const { data, errorMessage, response } = await callBackend<DraftListResponse>(
    `/drafts${query}`,
    { accessToken },
  );

  if (!data) {
    return jsonError(
      errorMessage ?? 'Failed to fetch drafts',
      response.status,
      mapDraftError(response.status),
    );
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const draft = await parseJsonBody(request);
  if (!draft || !isDraft(draft)) {
    return NextResponse.json({ error: 'Invalid draft payload', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const { id: _clientId, createdAt: _c, updatedAt: _u, ...payload } = draft as Draft & {
    createdAt?: unknown;
    updatedAt?: unknown;
  };

  const { data, errorMessage, response } = await callBackend<DraftResponse>('/drafts', {
    method: 'POST',
    body: JSON.stringify(payload),
    accessToken,
  });

  if (!data) {
    return jsonError(
      errorMessage ?? 'Failed to create draft',
      response.status,
      mapDraftError(response.status),
    );
  }

  return NextResponse.json({ draft: data }, { status: 201 });
}
