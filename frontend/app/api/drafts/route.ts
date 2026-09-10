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

import type { PaginatedDraftListResponse } from '@/lib/types/pagination';

export async function GET(request: Request) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const platform = searchParams.get('platform');
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');

  const queryParams = new URLSearchParams();
  if (workspaceId) queryParams.set('workspaceId', workspaceId);
  if (status) queryParams.set('status', status);
  if (search) queryParams.set('search', search);
  if (platform) queryParams.set('platform', platform);
  if (page) queryParams.set('page', page);
  if (limit) queryParams.set('limit', limit);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/drafts?${queryString}` : '/drafts';

  const { data, errorMessage, response } = await callBackend<PaginatedDraftListResponse>(
    endpoint,
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

  const payload = { ...draft } as Partial<Draft> & { createdAt?: unknown; updatedAt?: unknown };
  delete payload.id;
  delete payload.createdAt;
  delete payload.updatedAt;

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
