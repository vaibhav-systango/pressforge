import { NextResponse } from 'next/server';

import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import type { Draft } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

type PublishResponse = {
  draft: Draft;
  platform: string;
  externalPostId: string;
  publishedAt: number;
  message: string;
};

function mapPublishError(status: number): string {
  if (status === 404) return 'NOT_FOUND';
  if (status === 403) return 'ACCESS_DENIED';
  if (status === 401) return 'LINKEDIN_RECONNECT_REQUIRED';
  if (status === 400) return 'BAD_REQUEST';
  if (status === 502 || status === 503) return 'PUBLISH_FAILED';
  return 'PUBLISH_FAILED';
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const url = new URL(request.url);
  const organizationId = url.searchParams.get('organizationId');
  const query = organizationId
    ? `?organizationId=${encodeURIComponent(organizationId)}`
    : '';

  const { data, errorMessage, response } = await callBackend<PublishResponse>(
    `/drafts/${id}/publish${query}`,
    {
      method: 'POST',
      accessToken,
    },
  );

  if (!data) {
    return jsonError(
      errorMessage ?? 'Failed to publish draft',
      response.status,
      mapPublishError(response.status),
    );
  }

  return NextResponse.json(data);
}
