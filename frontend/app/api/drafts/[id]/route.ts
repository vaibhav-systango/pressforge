import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import { getDraft, updateDraft } from '@/lib/server/mock-store';
import { isDraft, parseJsonBody } from '@/lib/server/validate-payload';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await withAuth(async (auth) => {
    const draft = getDraft(auth.sessionId, id);
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    return { draft };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const draft = await parseJsonBody(request);

  if (!draft || !isDraft(draft)) {
    return NextResponse.json({ error: 'Invalid draft payload', code: 'BAD_REQUEST' }, { status: 400 });
  }

  if (draft.id !== id) {
    return NextResponse.json({ error: 'ID mismatch', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const result = await withAuth(async (auth) => {
    const updated = updateDraft(auth.sessionId, draft);
    return { draft: updated };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
