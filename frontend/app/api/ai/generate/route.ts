import { NextResponse } from 'next/server';

import { jsonError } from '@/lib/server/auth/with-auth';
import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { callBackend } from '@/lib/server/backend-client';
import { parseJsonBody } from '@/lib/server/validate-payload';
import type { AiGenerateRequest } from '@/lib/types/api';

type GenerateResponse = {
  variations: Array<{
    id: string;
    name: string;
    caption: string;
    hashtags: string[];
    imageBrief: string;
    liCaption: string;
    liHashtags: string[];
    liImageBrief: string;
    imageUrl: string | null;
  }>;
  prompt: string;
  imageWarning?: string | null;
};

export async function POST(request: Request) {
  const body = await parseJsonBody<AiGenerateRequest>(request);
  if (!body?.workspaceId) {
    return jsonError('workspaceId is required', 400, 'BAD_REQUEST');
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  try {
    const { data, errorMessage, response } = await callBackend<GenerateResponse>(
      '/content/generate',
      {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: body.workspaceId,
          prompt: body.prompt,
          platforms: body.platforms ?? ['instagram'],
          goal: body.goal,
          cta: body.cta,
          visualStyle: body.visualStyle,
          referenceUrls: body.referenceUrls ?? [],
          referenceText: body.referenceText ?? '',
          brandName: body.brandName,
          tone: body.tone,
          keywords: body.keywords,
          targetAudience: body.targetAudience,
          brandVoice: body.brandVoice,
          description: body.description,
          rules: body.rules,
        }),
        accessToken,
      },
    );

    if (!data) {
      const code =
        response.status === 503 && errorMessage !== 'Backend unavailable'
          ? 'GEMINI_NOT_CONFIGURED'
          : 'GENERATION_FAILED';
      return jsonError(
        errorMessage ?? 'Content generation failed',
        response.status,
        code,
      );
    }

    return NextResponse.json(data);
  } catch {
    return jsonError('Content generation failed', 503, 'GENERATION_FAILED');
  }
}
