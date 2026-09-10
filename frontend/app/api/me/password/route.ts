import { NextResponse } from 'next/server';

import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import { parseJsonBody } from '@/lib/server/validate-payload';

export async function PUT(request: Request) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const body = await parseJsonBody<{ currentPassword?: string; newPassword?: string }>(request);
  if (!body || !body.currentPassword || !body.newPassword) {
    return jsonError('Current password and new password are required', 400, 'BAD_REQUEST');
  }

  const { errorMessage, response } = await callBackend<unknown>('/auth/change-password', {
    method: 'PUT',
    accessToken,
    body: JSON.stringify({
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    }),
  });

  if (response.status >= 400) {
    return jsonError(errorMessage ?? 'Failed to change password', response.status, 'PASSWORD_CHANGE_FAILED');
  }

  return NextResponse.json({ success: true });
}
