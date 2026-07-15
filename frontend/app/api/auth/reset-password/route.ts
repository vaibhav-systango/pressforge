import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';

export async function POST(request: Request) {
  const body = (await request.json()) as { email: string; code: string; newPassword: string };

  const { data, errorMessage, response } = await callBackend<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      email: body.email,
      code: body.code,
      newPassword: body.newPassword,
    }),
  });

  if (!response.ok) {
    return jsonError(
      errorMessage ?? 'Failed to reset password',
      response.status,
      'RESET_PASSWORD_FAILED',
    );
  }

  return Response.json(data);
}
