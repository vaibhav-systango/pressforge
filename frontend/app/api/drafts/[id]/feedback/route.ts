import { NextResponse } from 'next/server';

import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import { parseJsonBody } from '@/lib/server/validate-payload';
import type { Draft } from '@/lib/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await parseJsonBody<{ feedback: string }>(request);
  if (!body?.feedback?.trim()) {
    return jsonError('feedback is required', 400, 'BAD_REQUEST');
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const { data, errorMessage, response } = await callBackend<Draft>(
    `/drafts/${id}/feedback`,
    {
      method: 'POST',
      body: JSON.stringify({ feedback: body.feedback }),
      accessToken,
    },
  );

  if (!data) {
    const statusCode = response.status;
    const code =
      statusCode === 404
        ? 'DRAFT_NOT_FOUND'
        : statusCode === 403
        ? 'ACCESS_DENIED'
        : statusCode === 502
        ? 'GENERATION_FAILED'
        : 'FEEDBACK_FAILED';
    return jsonError(errorMessage ?? 'Feedback submission failed', statusCode, code);
  }

  return NextResponse.json({ draft: data });
}
