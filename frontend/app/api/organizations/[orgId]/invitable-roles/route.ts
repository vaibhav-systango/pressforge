import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const endpoint = `/organizations/${orgId}/invitable-roles`;

  const { data, errorMessage, response } = await callBackend<any>(
    endpoint,
    {
      method: 'GET',
      accessToken,
    },
  );

  if (!data) {
    return jsonError(errorMessage ?? 'Failed to fetch invitable roles', response.status, 'FETCH_ROLES_FAILED');
  }

  return NextResponse.json(data);
}
