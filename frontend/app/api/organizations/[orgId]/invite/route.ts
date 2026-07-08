import { NextResponse } from 'next/server';

import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import { parseJsonBody } from '@/lib/server/validate-payload';
import type { InviteUserRequest, InviteUserResponse } from '@/lib/types/api';

function mapInviteErrorStatus(status: number): string {
  if (status === 404) return 'ORGANIZATION_NOT_FOUND';
  if (status === 403) return 'INSUFFICIENT_ROLE';
  if (status === 409) return 'INVITATION_CONFLICT';
  if (status === 502) return 'EMAIL_SEND_FAILED';
  return 'INVITATION_FAILED';
}

export async function POST(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await context.params;
  const body = await parseJsonBody<InviteUserRequest>(request);

  if (!body?.email || !body.fullName || !body.role) {
    return jsonError('Name, email, and role are required', 400, 'BAD_REQUEST');
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const { data, errorMessage, response } = await callBackend<InviteUserResponse>(
    `/organizations/${orgId}/invite`,
    {
      method: 'POST',
      body: JSON.stringify(body),
      accessToken,
    },
  );

  if (!data) {
    return jsonError(
      errorMessage ?? 'Failed to send invitation',
      response.status,
      mapInviteErrorStatus(response.status),
    );
  }

  return NextResponse.json(data, { status: 201 });
}
