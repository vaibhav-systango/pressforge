import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import { ORGANIZATION_ID_COOKIE } from '@/lib/server/issue-backend-auth';
import { mapBackendUserToMe } from '@/lib/auth/me-user';
import type { BackendUserResponse } from '@/lib/types/api';

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const { data, errorMessage, response } = await callBackend<BackendUserResponse>('/auth/me', {
    accessToken,
  });

  if (!data) {
    return jsonError(errorMessage ?? 'Not authenticated', response.status, 'TOKEN_INVALID');
  }

  const cookieStore = await cookies();
  const organizationId = data.organizationId ?? cookieStore.get(ORGANIZATION_ID_COOKIE)?.value ?? null;
  const user = mapBackendUserToMe({ ...data, organizationId });

  return NextResponse.json({ user });
}
