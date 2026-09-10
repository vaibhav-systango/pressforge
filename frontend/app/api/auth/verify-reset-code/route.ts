import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';

export async function POST(request: Request) {
  const body = (await request.json()) as { email: string; code: string };

  const { data, errorMessage, response } = await callBackend<{ message: string }>('/auth/verify-reset-code', {
    method: 'POST',
    body: JSON.stringify({ email: body.email, code: body.code }),
  });

  if (!response.ok) {
    return jsonError(
      errorMessage ?? 'Verification code is invalid or expired',
      response.status,
      'VERIFY_RESET_CODE_FAILED',
    );
  }

  return Response.json(data);
}
