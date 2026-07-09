import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AppState, Workspace, ClientUser, Schedule } from '@/lib/types';

export function useAppState() {
  const queryClient = useQueryClient();

  const { data: state, isLoading } = useQuery<AppState>({
    queryKey: ['app-state'],
    queryFn: async () => {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error('Failed to fetch state');
      const data = await res.json();
      return data.state;
    },
    staleTime: 0,
  });

  const updateStateMutation = useMutation({
    mutationFn: async (merge: Partial<AppState>) => {
      const res = await fetch('/api/state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merge }),
      });
      if (!res.ok) throw new Error('Failed to update state');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['app-state'], data.state);
    },
  });

  const resetStateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      if (!res.ok) throw new Error('Failed to reset state');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['app-state'], data.state);
    },
  });

  const addWorkspaceMutation = useMutation({
    mutationFn: async (workspace: Workspace) => {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspace),
      });
      if (!res.ok) throw new Error('Failed to add workspace');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['app-state'], data.state);
    },
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: async (workspace: Workspace) => {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspace),
      });
      if (!res.ok) throw new Error('Failed to update workspace');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-state'] });
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete workspace');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['app-state'], data.state);
    },
  });

  const addWorkspaceScheduleMutation = useMutation({
    mutationFn: async ({ workspaceId, schedule }: { workspaceId: string; schedule: Schedule }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule }),
      });
      if (!res.ok) throw new Error('Failed to add schedule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-state'] });
    },
  });

  const updateWorkspaceScheduleMutation = useMutation({
    mutationFn: async ({ workspaceId, schedule }: { workspaceId: string; schedule: Schedule }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-schedule', schedule }),
      });
      if (!res.ok) throw new Error('Failed to update schedule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-state'] });
    },
  });

  const deleteWorkspaceScheduleMutation = useMutation({
    mutationFn: async ({ workspaceId, scheduleId }: { workspaceId: string; scheduleId: string }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-schedule', scheduleId }),
      });
      if (!res.ok) throw new Error('Failed to delete schedule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-state'] });
    },
  });

  const addClientMutation = useMutation({
    mutationFn: async (client: ClientUser) => {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      });
      if (!res.ok) throw new Error('Failed to add client');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-state'] });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async (client: ClientUser) => {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      });
      if (!res.ok) throw new Error('Failed to update client');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-state'] });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete client');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-state'] });
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = state?.clients?.find(c => c.id === id);
      if (client) {
        const updated = { ...client, status: 'active' as const };
        const res = await fetch(`/api/clients/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
        if (!res.ok) throw new Error('Failed to accept invite');
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-state'] });
    },
  });

  const defaultState: AppState = {
    workspaces: [],
    activeWorkspaceId: null,
    currentStep: 1,
    orgUsers: [],
    connectedAccounts: { instagram: false, linkedin: false },
    clients: [],
    mockInbox: [],
    accountType: 'unassigned',
    currentUserType: 'user',
    drafts: [],
    mentions: [],
    campaigns: [],
    channels: [],
  };

  return {
    state: state || defaultState,
    isLoading,
    updateState: (updates: Partial<AppState> | ((prev: AppState) => AppState)) => {
      if (typeof updates === 'function') {
        const prev = state || defaultState;
        updateStateMutation.mutate(updates(prev));
      } else {
        updateStateMutation.mutate(updates);
      }
    },
    resetState: () => resetStateMutation.mutate(),
    addWorkspace: (workspace: Workspace) => addWorkspaceMutation.mutate(workspace),
    updateWorkspace: (workspace: Workspace) => updateWorkspaceMutation.mutate(workspace),
    deleteWorkspace: (id: string) => deleteWorkspaceMutation.mutate(id),
    addWorkspaceSchedule: (workspaceId: string, schedule: Schedule) =>
      addWorkspaceScheduleMutation.mutate({ workspaceId, schedule }),
    updateWorkspaceSchedule: (workspaceId: string, schedule: Schedule) =>
      updateWorkspaceScheduleMutation.mutate({ workspaceId, schedule }),
    deleteWorkspaceSchedule: (workspaceId: string, scheduleId: string) =>
      deleteWorkspaceScheduleMutation.mutate({ workspaceId, scheduleId }),
    addClient: (client: ClientUser) => addClientMutation.mutate(client),
    updateClient: (client: ClientUser) => updateClientMutation.mutate(client),
    deleteClient: (id: string) => deleteClientMutation.mutate(id),
    acceptInvite: (id: string) => acceptInviteMutation.mutate(id),
    setActiveWorkspace: (id: string) => {
      updateStateMutation.mutate({ activeWorkspaceId: id });
    },
    updateDraft: (draft: any) => {
      const prev = state || defaultState;
      const updatedDrafts = (prev.drafts || []).map((d) => (d.id === draft.id ? draft : d));
      updateStateMutation.mutate({ drafts: updatedDrafts });
    },
    addDraft: (draft: any) => {
      const prev = state || defaultState;
      const updatedDrafts = [...(prev.drafts || []), draft];
      updateStateMutation.mutate({ drafts: updatedDrafts });
    },
    addCampaign: (campaign: any) => {
      const prev = state || defaultState;
      const updatedCampaigns = [...(prev.campaigns || []), campaign];
      updateStateMutation.mutate({ campaigns: updatedCampaigns });
    },
    logout: async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      queryClient.setQueryData(['auth-user'], null);
      queryClient.invalidateQueries({ queryKey: ['app-state'] });
    },
  };
}

export function useJournalistsQuery() {
  return useQuery<{ journalists: any[] }>({
    queryKey: ['journalists'],
    queryFn: async () => {
      const res = await fetch('/api/journalists');
      if (!res.ok) throw new Error('Failed to fetch journalists');
      return res.json();
    },
  });
}
