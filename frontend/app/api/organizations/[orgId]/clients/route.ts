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

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const plan = searchParams.get('plan');
  const statusFilter = searchParams.get('status_filter');

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (plan) queryParams.set('plan', plan);
  if (statusFilter) queryParams.set('status_filter', statusFilter);

  const queryString = queryParams.toString();
  const endpoint = `/organizations/${orgId}/clients${queryString ? `?${queryString}` : ''}`;

  const { data, errorMessage, response } = await callBackend<any>(
    endpoint,
    {
      method: 'GET',
      accessToken,
    },
  );

  if (!data) {
    return jsonError(errorMessage ?? 'Failed to fetch clients', response.status, 'FETCH_CLIENTS_FAILED');
  }

  return NextResponse.json(data);
}
