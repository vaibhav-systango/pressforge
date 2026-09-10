import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import { getSessionState } from '@/lib/server/mock-store';

export async function GET() {
  const result = await withAuth(async (auth) => {
    const state = getSessionState(auth.sessionId);
    return { inbox: state.mockInbox };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
