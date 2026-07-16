import { NextResponse } from 'next/server';

import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import { isDraft, parseJsonBody } from '@/lib/server/validate-payload';
import type { Draft } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

function mapDraftError(status: number): string {
  if (status === 404) return 'NOT_FOUND';
  if (status === 403) return 'ACCESS_DENIED';
  if (status === 400) return 'BAD_REQUEST';
  return 'DRAFT_FAILED';
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const { data, errorMessage, response } = await callBackend<Draft>(`/drafts/${id}`, {
    accessToken,
  });

  if (!data) {
    return jsonError(
      errorMessage ?? 'Draft not found',
      response.status,
      mapDraftError(response.status),
    );
  }

  return NextResponse.json({ draft: data });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const draft = await parseJsonBody(request);

  if (!draft || !isDraft(draft)) {
    return NextResponse.json({ error: 'Invalid draft payload', code: 'BAD_REQUEST' }, { status: 400 });
  }

  if ((draft as Draft).id && (draft as Draft).id !== id) {
    return NextResponse.json({ error: 'ID mismatch', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const payload = { ...draft } as Partial<Draft> & { createdAt?: unknown; updatedAt?: unknown };
  delete payload.id;
  delete payload.workspaceId;
  delete payload.createdAt;
  delete payload.updatedAt;

  const { data, errorMessage, response } = await callBackend<Draft>(`/drafts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    accessToken,
  });

  if (!data) {
    return jsonError(
      errorMessage ?? 'Failed to update draft',
      response.status,
      mapDraftError(response.status),
    );
  }

  return NextResponse.json({ draft: data });
}
