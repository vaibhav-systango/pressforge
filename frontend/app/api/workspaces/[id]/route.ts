import { NextResponse } from 'next/server';

import { getAccessToken } from '@/lib/server/auth/get-access-token';
import { jsonError } from '@/lib/server/auth/with-auth';
import { callBackend } from '@/lib/server/backend-client';
import { parseJsonBody } from '@/lib/server/validate-payload';
import {
  mapScheduleResponse,
  mapWorkspaceResponse,
  scheduleToCreateRequest,
  scheduleToUpdateRequest,
  workspaceToUpdateRequest,
} from '@/lib/workspaces/map-workspace';
import type { ScheduleResponse, WorkspaceResponse } from '@/lib/types/api';
import type { Schedule, Workspace } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

function mapWorkspaceErrorStatus(status: number): string {
  if (status === 404) return 'WORKSPACE_NOT_FOUND';
  if (status === 403) return 'ACCESS_DENIED';
  if (status === 400) return 'BAD_REQUEST';
  return 'WORKSPACE_FAILED';
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const { data, errorMessage, response } = await callBackend<WorkspaceResponse>(
    `/workspaces/${id}`,
    { accessToken },
  );

  if (!data) {
    return jsonError(
      errorMessage ?? 'Failed to fetch workspace',
      response.status,
      mapWorkspaceErrorStatus(response.status),
    );
  }

  return NextResponse.json({ workspace: mapWorkspaceResponse(data) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await parseJsonBody<Workspace>(request);
  if (!body) {
    return jsonError('Invalid JSON', 400, 'BAD_REQUEST');
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const { data, errorMessage, response } = await callBackend<WorkspaceResponse>(
    `/workspaces/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(workspaceToUpdateRequest(body)),
      accessToken,
    },
  );

  if (!data) {
    return jsonError(
      errorMessage ?? 'Failed to update workspace',
      response.status,
      mapWorkspaceErrorStatus(response.status),
    );
  }

  return NextResponse.json({ workspace: mapWorkspaceResponse(data) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  const { errorMessage, response } = await callBackend<null>(`/workspaces/${id}`, {
    method: 'DELETE',
    accessToken,
  });

  if (!response.ok) {
    return jsonError(
      errorMessage ?? 'Failed to delete workspace',
      response.status,
      mapWorkspaceErrorStatus(response.status),
    );
  }

  return new NextResponse(null, { status: 204 });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await parseJsonBody<{
    schedule?: Schedule;
    action?: string;
    scheduleId?: string;
  }>(request);

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return jsonError('Authentication required', 401, 'TOKEN_MISSING');
  }

  if (body?.action === 'update-schedule' && body.schedule) {
    const { data, errorMessage, response } = await callBackend<ScheduleResponse>(
      `/workspaces/${id}/schedules/${body.schedule.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(scheduleToUpdateRequest(body.schedule)),
        accessToken,
      },
    );

    if (!data) {
      return jsonError(
        errorMessage ?? 'Failed to update schedule',
        response.status,
        mapWorkspaceErrorStatus(response.status),
      );
    }

    return NextResponse.json({ schedule: mapScheduleResponse(data) });
  }

  if (body?.schedule) {
    const scheduleFields: Partial<Schedule> = { ...body.schedule };
    delete scheduleFields.id;
    delete scheduleFields.workspaceId;
    const { data, errorMessage, response } = await callBackend<ScheduleResponse>(
      `/workspaces/${id}/schedules`,
      {
        method: 'POST',
        body: JSON.stringify(scheduleToCreateRequest(scheduleFields)),
        accessToken,
      },
    );

    if (!data) {
      return jsonError(
        errorMessage ?? 'Failed to create schedule',
        response.status,
        mapWorkspaceErrorStatus(response.status),
      );
    }

    return NextResponse.json({ schedule: mapScheduleResponse(data) });
  }

  if (body?.action === 'delete-schedule' && body.scheduleId) {
    const { errorMessage, response } = await callBackend<null>(
      `/workspaces/${id}/schedules/${body.scheduleId}`,
      {
        method: 'DELETE',
        accessToken,
      },
    );

    if (!response.ok) {
      return jsonError(
        errorMessage ?? 'Failed to delete schedule',
        response.status,
        mapWorkspaceErrorStatus(response.status),
      );
    }

    return NextResponse.json({ success: true });
  }

  return jsonError('Invalid action', 400, 'BAD_REQUEST');
}
