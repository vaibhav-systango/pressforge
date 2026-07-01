import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import {
  acceptInviteByEmail,
  addClient,
  deleteClient,
  getSessionState,
  inviteClient,
  updateClient,
} from '@/lib/server/mock-store';
import type { ClientUser } from '@/lib/types';

export async function GET() {
  const result = await withAuth(async (auth) => {
    const state = getSessionState(auth.sessionId);
    return { clients: state.clients, mockInbox: state.mockInbox };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const result = await withAuth(async (auth) => {
    const body = (await request.json()) as
      | ClientUser
      | { action: 'invite'; name: string; email: string; workspaceId: string }
      | { action: 'accept-invite'; email: string; password: string };

    if ('action' in body && body.action === 'invite') {
      const invited = inviteClient(auth.sessionId, body.name, body.email, body.workspaceId);
      return invited;
    }

    if ('action' in body && body.action === 'accept-invite') {
      const client = acceptInviteByEmail(auth.sessionId, body.email, body.password);
      if (!client) {
        return NextResponse.json({ error: 'Invalid invite', code: 'INVALID_INVITE' }, { status: 400 });
      }
      return { client };
    }

    const created = addClient(auth.sessionId, body as ClientUser);
    return { client: created };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
