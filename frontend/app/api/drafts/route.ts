import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import { addDraft, getSessionState, updateDraft } from '@/lib/server/mock-store';
import { isDraft, parseJsonBody } from '@/lib/server/validate-payload';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') ?? undefined;

  const result = await withAuth(async (auth) => {
    let drafts = getSessionState(auth.sessionId).drafts;
    if (workspaceId) {
      drafts = drafts.filter((d) => d.workspaceId === workspaceId);
    }
    return { drafts };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const draft = await parseJsonBody(request);
  if (!draft || !isDraft(draft)) {
    return NextResponse.json({ error: 'Invalid draft payload', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const result = await withAuth(async (auth) => {
    const created = addDraft(auth.sessionId, draft);
    return { draft: created };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
