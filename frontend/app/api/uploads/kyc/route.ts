import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';

export async function POST(request: Request) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return jsonError('No file provided', 400, 'BAD_REQUEST');
    }

    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const { data, errorMessage, response } = await callBackend<any>('/uploads/kyc', {
      method: 'POST',
      body: backendFormData,
      accessToken,
    });

    if (!data) {
      return jsonError(
        errorMessage ?? 'Upload failed',
        response.status,
        'UPLOAD_FAILED'
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return jsonError(error.message || 'Upload error', 500, 'INTERNAL_SERVER_ERROR');
  }
}
