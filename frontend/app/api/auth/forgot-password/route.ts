import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';

export async function POST(request: Request) {
  const body = (await request.json()) as { email: string };

  const { data, errorMessage, response } = await callBackend<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: body.email }),
  });

  if (!response.ok) {
    return jsonError(
      errorMessage ?? 'Failed to send verification code',
      response.status,
      'FORGOT_PASSWORD_FAILED',
    );
  }

  return Response.json(data);
}
