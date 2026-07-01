import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import { getSessionState } from '@/lib/server/mock-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') ?? undefined;

  const result = await withAuth(async (auth) => {
    let mentions = getSessionState(auth.sessionId).mentions;
    if (workspaceId) {
      mentions = mentions.filter((m) => m.workspaceId === workspaceId);
    }
    return { mentions };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
