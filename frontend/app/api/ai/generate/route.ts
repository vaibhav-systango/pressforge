import { NextResponse } from 'next/server';

import { MOCK_AI_OUTPUTS } from '@/lib/data/mock-data';
import { withAuth } from '@/lib/server/auth/with-auth';
import type { AiGenerateRequest } from '@/lib/types/api';

export async function POST(request: Request) {
  const result = await withAuth(async () => {
    const body = (await request.json()) as AiGenerateRequest;
    const variations = MOCK_AI_OUTPUTS.map((output, index) => ({
      id: `var-${index + 1}`,
      name: `Variation ${String.fromCharCode(65 + index)}`,
      caption: output.caption,
      hashtags: output.hashtags,
      imageBrief: output.imageBrief,
      liCaption: output.caption,
      liHashtags: output.hashtags,
      liImageBrief: output.imageBrief,
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(body.prompt)}-${index}/600/600`,
    }));
    return { variations, prompt: body.prompt };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
