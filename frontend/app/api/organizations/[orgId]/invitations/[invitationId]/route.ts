import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ orgId: string; invitationId: string }> },
) {
  const { orgId, invitationId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const { errorMessage, response } = await callBackend<any>(
    `/organizations/${orgId}/invitations/${invitationId}`,
    {
      method: 'DELETE',
      accessToken,
    },
  );

  if (response.status === 204 || response.ok) {
    return new NextResponse(null, { status: 204 });
  }

  return jsonError(errorMessage ?? 'Failed to delete invitation', response.status, 'DELETE_INVITATION_FAILED');
}
