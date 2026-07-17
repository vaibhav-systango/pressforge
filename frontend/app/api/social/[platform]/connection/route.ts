import { NextResponse } from 'next/server';

import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import { resolveRequestSession } from '@/lib/server/resolve-request-session';

export interface SocialAccountResponse {
  id: string;
  userId: string;
  organizationId: string | null;
  platform: string;
  externalAccountId: string;
  username: string | null;
  displayName: string | null;
  profilePictureUrl: string | null;
  facebookPageId: string | null;
  status: string;
  connectedAt: number;
  tokenExpiresAt: number | null;
}

export interface SocialConnectionResponse {
  platform: string;
  connected: boolean;
  account: SocialAccountResponse | null;
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

  const { data, errorMessage, response } = await callBackend<SocialConnectionResponse>(
    `/social/${platform}/connection${query}`,
    { accessToken: session.accessToken },
  );

  if (!data) {
    return jsonError(
      errorMessage ?? 'Failed to fetch social connection',
      response.status,
      'SOCIAL_CONNECTION_FAILED',
    );
  }

  return NextResponse.json(data);
}
