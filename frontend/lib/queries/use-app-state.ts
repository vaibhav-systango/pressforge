'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AppState, Workspace, ClientUser, Schedule, Draft, Campaign } from '@/lib/types';
import { INITIAL_STATE } from '@/lib/data/mock-data';
import { workspaceToCreateRequest, workspaceToUpdateRequest } from '@/lib/workspaces/map-workspace';

// ── Fetcher ───────────────────────────────────────────────────────────────────

async function fetchAppState(): Promise<{ state: AppState }> {
  const res = await fetch('/api/state');
  if (!res.ok) throw new Error('Failed to fetch app state');
  return res.json() as Promise<{ state: AppState }>;
}

async function fetchWorkspacesFromBackend(): Promise<{
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
}> {
  const res = await fetch('/api/workspaces');
  if (!res.ok) throw new Error('Failed to fetch workspaces');
  return res.json() as Promise<{ workspaces: Workspace[]; activeWorkspaceId: string | null }>;
}

const DEFAULT_CONNECTED_ACCOUNTS = { instagram: false, linkedin: false };

const EMPTY_STATE: AppState = {
  ...INITIAL_STATE,
  workspaces: [],
  clients: [],
  campaigns: [],
  drafts: [],
  mentions: [],
  mockInbox: [],
  orgUsers: [],
  connectedChannels: [],
  connectedAccounts: DEFAULT_CONNECTED_ACCOUNTS,
  activeWorkspaceId: null,
};

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useAppState() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['app-state'],
    queryFn: fetchAppState,
    staleTime: 30_000,
    retry: false,
  });

  const syncWorkspacesInCache = async () => {
    const workspaceData = await fetchWorkspacesFromBackend();
    queryClient.setQueryData(['app-state'], (old: { state: AppState } | undefined) => {
      const prevState = old?.state ?? EMPTY_STATE;
      return {
        state: {
          ...prevState,
          workspaces: workspaceData.workspaces,
          activeWorkspaceId:
            workspaceData.activeWorkspaceId ?? prevState.activeWorkspaceId ?? null,
        },
      };
    });
    return workspaceData;
  };

  const mergeMutation = useMutation({
    mutationFn: async (merge: Partial<AppState>) => {
      const res = await fetch('/api/state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merge }),
      });
      if (!res.ok) throw new Error('Failed to update state');
      return res.json() as Promise<{ state: AppState }>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['app-state'], data);
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      if (!res.ok) throw new Error('Failed to reset state');
      return res.json() as Promise<{ state: AppState }>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['app-state'], data);
    },
  });

  const state: AppState = {
    ...EMPTY_STATE,
    ...query.data?.state,
    workspaces: query.data?.state?.workspaces ?? [],
    clients: query.data?.state?.clients ?? [],
    campaigns: query.data?.state?.campaigns ?? [],
    drafts: query.data?.state?.drafts ?? [],
    mentions: query.data?.state?.mentions ?? [],
    mockInbox: query.data?.state?.mockInbox ?? [],
    orgUsers: query.data?.state?.orgUsers ?? [],
    connectedChannels: query.data?.state?.connectedChannels ?? [],
    connectedAccounts: query.data?.state?.connectedAccounts ?? DEFAULT_CONNECTED_ACCOUNTS,
  };

  const updateState = async (
    mergeOrFn: Partial<AppState> | ((prev: AppState) => Partial<AppState> | AppState)
  ) => {
    const nextState = typeof mergeOrFn === 'function' ? mergeOrFn(state) : mergeOrFn;
    return mergeMutation.mutateAsync(nextState);
  };

  const addWorkspace = async (workspace: Workspace) => {
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workspaceToCreateRequest(workspace)),
    });
    if (!res.ok) throw new Error('Failed to create workspace');

    const data = (await res.json()) as { workspace: Workspace };
    await syncWorkspacesInCache();

    if (!state.activeWorkspaceId) {
      await setActiveWorkspace(data.workspace.id);
    }

    return data;
  };

  const updateWorkspace = async (workspace: Workspace) => {
    const res = await fetch(`/api/workspaces/${workspace.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workspaceToUpdateRequest(workspace)),
    });
    if (!res.ok) throw new Error('Failed to update workspace');

    await syncWorkspacesInCache();
    return res.json() as Promise<{ workspace: Workspace }>;
  };

  const deleteWorkspace = async (workspaceId: string) => {
    const res = await fetch(`/api/workspaces/${workspaceId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete workspace');

    const workspaceData = await syncWorkspacesInCache();
    if (state.activeWorkspaceId === workspaceId) {
      const nextActive =
        workspaceData.workspaces.find((w) => w.id !== workspaceId)?.id ??
        workspaceData.workspaces[0]?.id ??
        null;
      if (nextActive !== state.activeWorkspaceId) {
        await setActiveWorkspace(nextActive);
      }
    }
  };

  const addClient = async (client: ClientUser) => {
    return updateState((prev) => ({
      clients: [...(prev.clients || []), client],
    }));
  };

  const updateClient = async (client: ClientUser) => {
    return updateState((prev) => ({
      clients: (prev.clients || []).map((c) => (c.id === client.id ? client : c)),
    }));
  };

  const deleteClient = async (clientId: string) => {
    return updateState((prev) => ({
      clients: (prev.clients || []).filter((c) => c.id !== clientId),
    }));
  };

  const inviteClient = async (name: string, email: string, workspaceId: string) => {
    const newClient: ClientUser = {
      id: `client-${Date.now()}`,
      name,
      email,
      workspaceId,
      status: 'pending',
    };
    return addClient(newClient);
  };

  const acceptInvite = async (clientId: string) => {
    return updateState((prev) => ({
      clients: (prev.clients || []).map((c) =>
        c.id === clientId ? { ...c, status: 'active' as const } : c
      ),
    }));
  };

  const addWorkspaceSchedule = async (workspaceId: string, schedule: Schedule) => {
    const { id: _id, workspaceId: _wsId, ...scheduleFields } = schedule;
    const res = await fetch(`/api/workspaces/${workspaceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule: { ...scheduleFields, id: schedule.id } }),
    });
    if (!res.ok) throw new Error('Failed to add schedule');
    await syncWorkspacesInCache();
    return res.json() as Promise<{ schedule: Schedule }>;
  };

  const updateWorkspaceSchedule = async (workspaceId: string, schedule: Schedule) => {
    const res = await fetch(`/api/workspaces/${workspaceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-schedule', schedule }),
    });
    if (!res.ok) throw new Error('Failed to update schedule');
    await syncWorkspacesInCache();
    return res.json() as Promise<{ schedule: Schedule }>;
  };

  const deleteWorkspaceSchedule = async (workspaceId: string, scheduleId: string) => {
    const res = await fetch(`/api/workspaces/${workspaceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete-schedule', scheduleId }),
    });
    if (!res.ok) throw new Error('Failed to delete schedule');
    await syncWorkspacesInCache();
  };

  const addDraft = async (draft: Draft) => {
    return updateState((prev) => ({
      drafts: [...(prev.drafts || []), draft],
    }));
  };

  const updateDraft = async (draft: Draft) => {
    return updateState((prev) => ({
      drafts: (prev.drafts || []).map((d) => (d.id === draft.id ? draft : d)),
    }));
  };

  const addCampaign = async (campaign: Campaign) => {
    return updateState((prev) => ({
      campaigns: [...(prev.campaigns || []), campaign],
    }));
  };

  const setActiveWorkspace = async (workspaceId: string | null) => {
    const res = await fetch('/api/session/workspace', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId }),
    });
    if (!res.ok) throw new Error('Failed to set active workspace');

    const data = (await res.json()) as { activeWorkspaceId: string | null };
    queryClient.setQueryData(['app-state'], (old: { state: AppState } | undefined) => ({
      state: {
        ...(old?.state ?? EMPTY_STATE),
        activeWorkspaceId: data.activeWorkspaceId,
      },
    }));
  };

  const resetState = async () => {
    return resetMutation.mutateAsync();
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    queryClient.setQueryData(['app-state'], null);
  };

  return {
    state,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    mergeState: mergeMutation.mutateAsync,
    resetState,
    updateState,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    addClient,
    updateClient,
    deleteClient,
    inviteClient,
    acceptInvite,
    addWorkspaceSchedule,
    updateWorkspaceSchedule,
    deleteWorkspaceSchedule,
    addDraft,
    updateDraft,
    addCampaign,
    setActiveWorkspace,
    logout,
  };
}

// ── Journalists ───────────────────────────────────────────────────────────────

import type { Journalist } from '@/lib/types';

export function useJournalistsQuery() {
  return useQuery({
    queryKey: ['journalists'],
    queryFn: async () => {
      const res = await fetch('/api/journalists');
      if (!res.ok) throw new Error('Failed to fetch journalists');
      const data = (await res.json()) as { journalists: Journalist[] };
      return data.journalists;
    },
    staleTime: 5 * 60 * 1000,
  });
}
