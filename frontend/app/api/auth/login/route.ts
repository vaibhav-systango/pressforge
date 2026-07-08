import { issueBackendAuthResponse } from '@/lib/server/issue-backend-auth';
import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import type { BackendTokenResponse, LoginRequest } from '@/lib/types/api';

export async function POST(request: Request) {
  const body = (await request.json()) as LoginRequest;

  const { data, errorMessage, response } = await callBackend<BackendTokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: body.email, password: body.password }),
  });

  if (!data) {
    return jsonError(
      errorMessage ?? 'Invalid email or password',
      response.status === 401 ? 401 : response.status,
      'INVALID_CREDENTIALS',
    );
  }

  return issueBackendAuthResponse(data);
}
