import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import { deleteClient, updateClient } from '@/lib/server/mock-store';
import { isClientUser, parseJsonBody } from '@/lib/server/validate-payload';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const client = await parseJsonBody(request);

  if (!client || !isClientUser(client)) {
    return NextResponse.json({ error: 'Invalid client payload', code: 'BAD_REQUEST' }, { status: 400 });
  }

  if (client.id !== id) {
    return NextResponse.json({ error: 'ID mismatch', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const result = await withAuth(async (auth) => {
    const updated = updateClient(auth.sessionId, client);
    return { client: updated };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await withAuth(async (auth) => {
    deleteClient(auth.sessionId, id);
    return { success: true };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
