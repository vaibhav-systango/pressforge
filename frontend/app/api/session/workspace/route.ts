import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import { updateSession } from '@/lib/server/mock-store';

export async function PATCH(request: Request) {
  const result = await withAuth(async (auth) => {
    const { workspaceId } = (await request.json()) as { workspaceId: string };
    const state = updateSession(auth.sessionId, { activeWorkspaceId: workspaceId });
    return { activeWorkspaceId: state.activeWorkspaceId, state };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
