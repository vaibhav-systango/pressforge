import { NextResponse } from 'next/server';

import { issueAuthResponse } from '@/lib/server/auth/issue-session';
import { withAuth } from '@/lib/server/auth/with-auth';
import {
  addClient,
  getSessionState,
  inviteClient,
  loginUser,
} from '@/lib/server/mock-store';
import { parseJsonBody } from '@/lib/server/validate-payload';
import { isClientUser } from '@/lib/server/validate-payload';
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
  const body = await parseJsonBody<
    | ClientUser
    | { action: 'invite'; name: string; email: string; workspaceId: string }
    | { action: 'accept-invite'; email: string; password: string }
  >(request);

  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  if ('action' in body && body.action === 'accept-invite') {
    if (!body.email || !body.password) {
      return NextResponse.json({ error: 'email and password required', code: 'BAD_REQUEST' }, { status: 400 });
    }

    const sessionId = crypto.randomUUID();
    const user = loginUser(sessionId, body.email, body.password);
    if (!user || user.userType !== 'client') {
      return NextResponse.json({ error: 'Invalid invite', code: 'INVALID_INVITE' }, { status: 400 });
    }

    return issueAuthResponse(sessionId, user, { client: { email: body.email } });
  }

  const result = await withAuth(async (auth) => {
    if ('action' in body && body.action === 'invite') {
      const invited = inviteClient(auth.sessionId, body.name, body.email, body.workspaceId);
      return invited;
    }

    if (!isClientUser(body)) {
      return NextResponse.json({ error: 'Invalid client payload', code: 'BAD_REQUEST' }, { status: 400 });
    }

    const created = addClient(auth.sessionId, body);
    return { client: created };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
