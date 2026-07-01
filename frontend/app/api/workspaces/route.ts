import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import {
  addWorkspace,
  deleteWorkspace,
  getSessionState,
  updateSession,
  updateWorkspace,
} from '@/lib/server/mock-store';
import type { Workspace } from '@/lib/types';

export async function GET() {
  const result = await withAuth(async (auth) => {
    const state = getSessionState(auth.sessionId);
    return { workspaces: state.workspaces, activeWorkspaceId: state.activeWorkspaceId };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const result = await withAuth(async (auth) => {
    const workspace = (await request.json()) as Workspace;
    const state = addWorkspace(auth.sessionId, workspace);
    return { workspace, state };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
