import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import { getMe } from '@/lib/server/mock-store';

export async function GET() {
  const result = await withAuth(async (auth) => getMe(auth.sessionId));

  if (result instanceof NextResponse) {
    return result;
  }

  return NextResponse.json(result);
}
