import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import { addDraft, getSessionState, updateDraft } from '@/lib/server/mock-store';
import type { Draft } from '@/lib/types';

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
  const result = await withAuth(async (auth) => {
    const draft = (await request.json()) as Draft;
    const created = addDraft(auth.sessionId, draft);
    return { draft: created };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
