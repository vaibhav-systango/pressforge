import type { Schedule, Workspace } from '@/lib/types';
import type { ScheduleResponse, WorkspaceResponse } from '@/lib/types/api';

function nullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

export function mapScheduleResponse(schedule: ScheduleResponse): Schedule {
  return {
    id: schedule.id,
    workspaceId: schedule.workspaceId,
    platform: nullToUndefined(schedule.platform),
    dayOfWeek: nullToUndefined(schedule.dayOfWeek),
    time: nullToUndefined(schedule.time),
    contentType: nullToUndefined(schedule.contentType),
    label: nullToUndefined(schedule.label),
    datetime: nullToUndefined(schedule.datetime),
    recurrence: schedule.recurrence as Schedule['recurrence'],
    publishAsDraft: schedule.publishAsDraft,
    enabled: schedule.enabled,
    nextRun: nullToUndefined(schedule.nextRun),
  };
}

export function mapWorkspaceResponse(workspace: WorkspaceResponse): Workspace {
  return {
    id: workspace.id,
    name: workspace.name,
    website: nullToUndefined(workspace.website),
    description: nullToUndefined(workspace.description),
    industry: nullToUndefined(workspace.industry),
    targetAudience: nullToUndefined(workspace.targetAudience),
    brandVoice: nullToUndefined(workspace.brandVoice),
    prompt: nullToUndefined(workspace.prompt),
    logoUrl: nullToUndefined(workspace.logoUrl),
    tone: workspace.tone as Workspace['tone'],
    keywords: workspace.keywords ?? [],
    rules: workspace.rules ?? [],
    ownerId: nullToUndefined(workspace.ownerId),
    schedules: (workspace.schedules ?? []).map(mapScheduleResponse),
  };
}

export function workspaceToCreateRequest(
  workspace: Pick<
    Workspace,
    'name' | 'website' | 'description' | 'industry' | 'targetAudience' | 'brandVoice' | 'prompt' | 'logoUrl' | 'tone' | 'keywords' | 'rules'
  >,
) {
  return {
    name: workspace.name,
    website: workspace.website,
    description: workspace.description,
    industry: workspace.industry,
    targetAudience: workspace.targetAudience,
    brandVoice: workspace.brandVoice,
    prompt: workspace.prompt,
    logoUrl: workspace.logoUrl,
    tone: workspace.tone,
    keywords: workspace.keywords ?? [],
    rules: workspace.rules ?? [],
  };
}

export function workspaceToUpdateRequest(
  workspace: Pick<
    Workspace,
    'name' | 'website' | 'description' | 'industry' | 'targetAudience' | 'brandVoice' | 'prompt' | 'logoUrl' | 'tone' | 'keywords' | 'rules'
  >,
) {
  return workspaceToCreateRequest(workspace);
}

export function scheduleToCreateRequest(
  schedule: Omit<Schedule, 'id' | 'workspaceId'>,
) {
  return {
    platform: schedule.platform,
    dayOfWeek: schedule.dayOfWeek,
    time: schedule.time,
    contentType: schedule.contentType,
    label: schedule.label,
    datetime: schedule.datetime,
    recurrence: schedule.recurrence ?? 'none',
    publishAsDraft: schedule.publishAsDraft ?? false,
    enabled: schedule.enabled ?? true,
    nextRun: schedule.nextRun,
  };
}

export function scheduleToUpdateRequest(schedule: Schedule) {
  return scheduleToCreateRequest(schedule);
}
