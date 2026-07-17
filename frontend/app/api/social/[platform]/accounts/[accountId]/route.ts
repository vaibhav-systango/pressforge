import { NextResponse } from 'next/server';

import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import { resolveRequestSession } from '@/lib/server/resolve-request-session';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ platform: string; accountId: string }> },
) {
  const { platform, accountId } = await params;
  const session = await resolveRequestSession();

  if (!session.isAuthenticated || !session.accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const { errorMessage, response } = await callBackend<null>(
    `/social/${platform}/accounts/${accountId}`,
    {
      method: 'DELETE',
      accessToken: session.accessToken,
    },
  );

  if (!response.ok) {
    return jsonError(
      errorMessage ?? 'Failed to disconnect social account',
      response.status,
      'SOCIAL_DISCONNECT_FAILED',
    );
  }

  return new NextResponse(null, { status: 204 });
}
