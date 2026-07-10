import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const { data, errorMessage, response } = await callBackend<string[]>(
    '/plans',
    {
      method: 'GET',
      accessToken,
    },
  );

  if (!data) {
    return jsonError(errorMessage ?? 'Failed to fetch plans', response.status, 'FETCH_PLANS_FAILED');
  }

  return NextResponse.json(data);
}
