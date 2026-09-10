import { NextResponse } from 'next/server';

import { createSession } from '@/lib/server/mock-store';
import { parseJsonBody } from '@/lib/server/validate-payload';

export async function POST(request: Request) {
  const body = await parseJsonBody<{ userId?: string }>(request);
  if (!body?.userId) {
    return NextResponse.json({ error: 'userId required', code: 'BAD_REQUEST' }, { status: 400 });
  }

  createSession(body.userId);
  return NextResponse.json({ success: true });
}
