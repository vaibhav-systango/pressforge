import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import { updateSession } from '@/lib/server/mock-store';
import type { AppState } from '@/lib/types';

export async function PATCH(request: Request) {
  const result = await withAuth(async (auth) => {
    const merge = (await request.json()) as Partial<AppState>;
    const state = updateSession(auth.sessionId, (prev) => ({ ...prev, ...merge }));
    return { state };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
