import { issueBackendAuthResponse } from '@/lib/server/issue-backend-auth';
import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import type { BackendTokenResponse, SignupRequest } from '@/lib/types/api';

export async function POST(request: Request) {
  const body = (await request.json()) as SignupRequest;

  const { data, errorMessage, response } = await callBackend<BackendTokenResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      fullName: body.fullName ?? body.name,
      email: body.email,
      password: body.password,
    }),
  });

  if (!data) {
    return jsonError(
      errorMessage ?? 'Unable to create account',
      response.status === 400 ? 400 : response.status,
      'SIGNUP_FAILED',
    );
  }

  return await issueBackendAuthResponse(data);
}
