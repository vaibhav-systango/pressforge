import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import { getSessionState, updateSession } from '@/lib/server/mock-store';

export async function GET() {
  const result = await withAuth(async (auth) => {
    const state = getSessionState(auth.sessionId);
    return { channels: state.connectedChannels ?? [] };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}

export async function PUT(request: Request) {
  const result = await withAuth(async (auth) => {
    const { channels } = (await request.json()) as {
      channels: Array<{ id: string; name: string; platform: string }>;
    };
    const state = updateSession(auth.sessionId, { connectedChannels: channels });
    return { channels: state.connectedChannels ?? [] };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
