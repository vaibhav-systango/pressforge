import { NextResponse } from 'next/server';

import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import { resolveRequestSession } from '@/lib/server/resolve-request-session';

interface ConnectResponse {
  authorizationUrl: string;
  platform: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const session = await resolveRequestSession();

  if (!session.isAuthenticated || !session.accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const organizationId = new URL(request.url).searchParams.get('organizationId');
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';

  const { data, errorMessage, response } = await callBackend<ConnectResponse>(
    `/social/${platform}/connect${query}`,
    { accessToken: session.accessToken },
  );

  if (!data) {
    return jsonError(errorMessage ?? 'Failed to start social connect', response.status, 'SOCIAL_CONNECT_FAILED');
  }

  return NextResponse.json(data);
}
