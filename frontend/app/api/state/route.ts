import { NextResponse } from 'next/server';

import { ApiError, withAuth } from '@/lib/server/auth/with-auth';
import { resetSession, updateSession } from '@/lib/server/mock-store';
import { parseJsonBody } from '@/lib/server/validate-payload';
import type { AppState } from '@/lib/types';

export async function PATCH(request: Request) {
  const body = await parseJsonBody<{ merge?: Partial<AppState> }>(request);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const result = await withAuth(async (auth) => {
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
  const body = await parseJsonBody<{ action?: string }>(request);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const result = await withAuth(async (auth) => {
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
