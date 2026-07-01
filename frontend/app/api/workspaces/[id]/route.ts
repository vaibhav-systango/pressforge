import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/server/auth/with-auth';
import {
  addWorkspaceSchedule,
  deleteWorkspace,
  deleteWorkspaceSchedule,
  updateWorkspace,
  updateWorkspaceSchedule,
} from '@/lib/server/mock-store';
import type { Schedule, Workspace } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await withAuth(async (auth) => {
    const workspace = (await request.json()) as Workspace;
    if (workspace.id !== id) {
      return NextResponse.json({ error: 'ID mismatch', code: 'BAD_REQUEST' }, { status: 400 });
    }
    updateWorkspace(auth.sessionId, workspace);
    return { workspace };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await withAuth(async (auth) => {
    const state = deleteWorkspace(auth.sessionId, id);
    return { state };
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await withAuth(async (auth) => {
    const body = (await request.json()) as { schedule?: Schedule; action?: string; scheduleId?: string };
    if (body.schedule) {
      const schedule = addWorkspaceSchedule(auth.sessionId, id, body.schedule);
      return { schedule };
    }
    if (body.action === 'update-schedule' && body.schedule) {
      const schedule = updateWorkspaceSchedule(auth.sessionId, id, body.schedule);
      return { schedule };
    }
    if (body.action === 'delete-schedule' && body.scheduleId) {
      deleteWorkspaceSchedule(auth.sessionId, id, body.scheduleId);
      return { success: true };
    }
    return NextResponse.json({ error: 'Invalid action', code: 'BAD_REQUEST' }, { status: 400 });
  });

  if (result instanceof NextResponse) return result;
  return NextResponse.json(result);
}
