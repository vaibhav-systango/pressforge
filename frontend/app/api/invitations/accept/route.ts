import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import { issueBackendAuthResponse } from '@/lib/server/issue-backend-auth';
import { parseJsonBody } from '@/lib/server/validate-payload';
import type { AcceptInvitationRequest, BackendTokenResponse } from '@/lib/types/api';

function mapAcceptErrorStatus(status: number): string {
  if (status === 404) return 'INVITATION_NOT_FOUND';
  if (status === 410) return 'INVITATION_EXPIRED';
  if (status === 409) return 'INVITATION_ALREADY_ACCEPTED';
  return 'ACCEPTATION_FAILED';
}

export async function POST(request: Request) {
  const body = await parseJsonBody<AcceptInvitationRequest>(request);

  if (!body?.token || !body.password) {
    return jsonError('Invitation token and password are required', 400, 'BAD_REQUEST');
  }

  if (body.password.length < 8 || body.password.length > 30) {
    return jsonError('Password must be between 8 and 30 characters', 400, 'INVALID_PASSWORD');
  }

  const { data, errorMessage, response } = await callBackend<BackendTokenResponse>(
    '/invitations/accept',
    {
      method: 'POST',
      body: JSON.stringify({ token: body.token, password: body.password }),
    },
  );

  if (!data) {
    return jsonError(
      errorMessage ?? 'Failed to accept invitation',
      response.status,
      mapAcceptErrorStatus(response.status),
    );
  }

  return issueBackendAuthResponse(data);
}
