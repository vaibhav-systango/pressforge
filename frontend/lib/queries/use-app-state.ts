'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AppState, Workspace, ClientUser, Schedule, Draft, Campaign } from '@/lib/types';
import { INITIAL_STATE } from '@/lib/data/mock-data';

// ── Fetcher ───────────────────────────────────────────────────────────────────

async function fetchAppState(): Promise<{ state: AppState }> {
  const res = await fetch('/api/state');
  if (!res.ok) throw new Error('Failed to fetch app state');
  return res.json() as Promise<{ state: AppState }>;
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
    return updateState((prev) => ({
      workspaces: [...(prev.workspaces || []), workspace],
    }));
  };

  const updateWorkspace = async (workspace: Workspace) => {
    return updateState((prev) => ({
      workspaces: (prev.workspaces || []).map((w) => (w.id === workspace.id ? workspace : w)),
    }));
  };

  const deleteWorkspace = async (workspaceId: string) => {
    return updateState((prev) => ({
      workspaces: (prev.workspaces || []).filter((w) => w.id !== workspaceId),
      activeWorkspaceId:
        prev.activeWorkspaceId === workspaceId
          ? ((prev.workspaces || []).find((w) => w.id !== workspaceId)?.id ?? null)
          : prev.activeWorkspaceId,
    }));
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
    return updateState((prev) => ({
      workspaces: (prev.workspaces || []).map((w) =>
        w.id === workspaceId ? { ...w, schedules: [...(w.schedules || []), schedule] } : w
      ),
    }));
  };

  const updateWorkspaceSchedule = async (workspaceId: string, schedule: Schedule) => {
    return updateState((prev) => ({
      workspaces: (prev.workspaces || []).map((w) =>
        w.id === workspaceId
          ? {
              ...w,
              schedules: (w.schedules || []).map((s) => (s.id === schedule.id ? schedule : s)),
            }
          : w
      ),
    }));
  };

  const deleteWorkspaceSchedule = async (workspaceId: string, scheduleId: string) => {
    return updateState((prev) => ({
      workspaces: (prev.workspaces || []).map((w) =>
        w.id === workspaceId
          ? { ...w, schedules: (w.schedules || []).filter((s) => s.id !== scheduleId) }
          : w
      ),
    }));
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
    return updateState({ activeWorkspaceId: workspaceId });
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
