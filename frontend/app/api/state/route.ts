import { NextResponse } from 'next/server';

import { ApiError, withAuth } from '@/lib/server/auth/with-auth';
import { resetSession, updateSession } from '@/lib/server/mock-store';
import type { AppState } from '@/lib/types';

export async function PATCH(request: Request) {
  const result = await withAuth(async (auth) => {
    const body = (await request.json()) as { merge?: Partial<AppState> };
    if (!body.merge) {
      return NextResponse.json({ error: 'merge required', code: 'BAD_REQUEST' }, { status: 400 });
    }
    const state = updateSession(auth.sessionId, (prev) => ({ ...prev, ...body.merge }));
    return { state };
  });

  if (result instanceof NextResponse) {
    return result;
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const result = await withAuth(async (auth) => {
    const body = (await request.json()) as { action?: string };
    if (body.action === 'reset') {
      const state = resetSession(auth.sessionId);
      return { state };
    }
    throw new ApiError('Unknown action', 400, 'BAD_REQUEST');
  });

  if (result instanceof NextResponse) {
    return result;
  }

  return NextResponse.json(result);
}
