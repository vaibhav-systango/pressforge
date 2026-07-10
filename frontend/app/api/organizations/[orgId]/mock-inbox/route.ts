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

  const { data, errorMessage, response } = await callBackend<any>(
    `/organizations/${orgId}/mock-inbox`,
    {
      method: 'GET',
      accessToken,
    },
  );

  if (!data) {
    return jsonError(errorMessage ?? 'Failed to fetch mock inbox', response.status, 'FETCH_MOCK_INBOX_FAILED');
  }

  return NextResponse.json(data);
}
