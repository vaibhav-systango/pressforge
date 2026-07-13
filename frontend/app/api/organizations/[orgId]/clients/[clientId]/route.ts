import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orgId: string; clientId: string }> },
) {
  const { orgId, clientId } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  try {
    const body = await request.json();

    const { data, errorMessage, response } = await callBackend<any>(
      `/organizations/${orgId}/members/${clientId}/workspace`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          workspaceId: body.workspaceId !== undefined ? body.workspaceId : undefined,
          workspaceIds: body.workspaceIds !== undefined ? body.workspaceIds : undefined,
          action: body.action !== undefined ? body.action : undefined,
        }),
        accessToken,
      },
    );

    if (!data) {
      return jsonError(
        errorMessage ?? 'Failed to update client workspace assignment',
        response.status,
        'ASSIGN_WORKSPACE_FAILED',
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error patching client workspace assignment:', err);
    return jsonError(err.message ?? 'Internal error', 500, 'INTERNAL_ERROR');
  }
}
