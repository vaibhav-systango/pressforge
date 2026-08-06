'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import type { Workspace, ClientUser, Schedule } from '@/lib/types';

// Sub-components
import { WorkspacesSkeleton } from './components/workspaces-skeleton';
import { ClientWorkspaceView } from './components/client-workspace-view';
import { CreateWorkspaceModal } from './components/create-workspace-modal';
import { WorkspaceDeleteModal, ScheduleDeleteModal } from './components/workspace-delete-modal';
import { WorkspaceSelector } from './components/workspace-selector';
import { EditWorkspaceForm } from './components/edit-workspace-form';
import { ClientAllocationCard } from './components/client-allocation-card';
import { WorkspaceSchedulerCard } from './components/workspace-scheduler-card';

// Validation helpers
import { 
  validateWorkspaceName, 
  validateWebsiteUrl, 
  validateBrandVoice 
} from '@/lib/utils/validation';

const TONES = ['professional', 'friendly', 'witty', 'bold', 'empathetic'] as const;
type ToneOption = (typeof TONES)[number];

export function WorkspacesView() {
  const { 
    state, 
    updateState,
    addWorkspace, 
    updateWorkspace, 
    deleteWorkspace, 
    updateClient,
    addWorkspaceSchedule, 
    deleteWorkspaceSchedule,
    setActiveWorkspace,
    refetch,
  } = useAppState();

  const isClient = state.currentUserType === 'client';
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);

  // Workspace selection state
  const [localSelectedWorkspaceId, setLocalSelectedWorkspaceId] = useState<string>('');
  const selectedWorkspaceId = localSelectedWorkspaceId || workspaces[0]?.id || '';
  const setSelectedWorkspaceId = setLocalSelectedWorkspaceId;

  const initialLoadDone = React.useRef(false);

  const fetchWorkspaces = React.useCallback(async () => {
    try {
      refetch();
      const res = await fetch(`/api/workspaces`);
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces || []);
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    } finally {
      setIsLoadingWorkspaces(false);
      initialLoadDone.current = true;
    }
  }, [refetch]);

  React.useEffect(() => {
    const handle = setTimeout(() => {
      fetchWorkspaces();
    }, 0);
    return () => clearTimeout(handle);
  }, [fetchWorkspaces]);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Workspace forms states
  const [isCreating, setIsCreating] = useState(() => searchParams.get('new') === 'true');
  
  // Selected workspace values
  const currentWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId) || workspaces[0];
  
  // Edit state
  const [brandName, setBrandName] = useState(currentWorkspace?.name || '');
  const [website, setWebsite] = useState(currentWorkspace?.website || '');
  const [tone, setTone] = useState<ToneOption>(
    (currentWorkspace?.tone as ToneOption) || 'professional',
  );
  const [brandVoice, setBrandVoice] = useState(currentWorkspace?.brandVoice || '');
  const [keywords, setKeywords] = useState<string[]>(currentWorkspace?.keywords || []);
  const [rules, setRules] = useState<string[]>(currentWorkspace?.rules || []);
  
  // Delete/Action Confirmation States
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const [scheduleDeleteConfirmId, setScheduleDeleteConfirmId] = useState<string | null>(null);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [isDeallocatingClientId, setIsDeallocatingClientId] = useState<string | null>(null);

  // Scheduler local form state
  const [newScheduleLabel, setNewScheduleLabel] = useState('');
  const [newScheduleDatetime, setNewScheduleDatetime] = useState('');
  const [newScheduleRecurrence, setNewScheduleRecurrence] = useState<'none'|'daily'|'weekly'|'monthly'>('none');
  const [newSchedulePublishDraft, setNewSchedulePublishDraft] = useState(false);

  // Client allocation state
  const [selectedClientToAllocate, setSelectedClientToAllocate] = useState<string>('');
  const [isAddingClient, setIsAddingClient] = useState(false);

  // Error States
  const [editValidationError, setEditValidationError] = useState<string | null>(null);
  const [deleteWorkspaceError, setDeleteWorkspaceError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [deleteScheduleError, setDeleteScheduleError] = useState<string | null>(null);
  const [clientAllocationError, setClientAllocationError] = useState<string | null>(null);

  // Edit Form Field Errors
  const [brandNameError, setBrandNameError] = useState<string | null>(null);
  const [websiteError, setWebsiteError] = useState<string | null>(null);
  const [brandVoiceError, setBrandVoiceError] = useState<string | null>(null);

  const openCreateModal = React.useCallback(() => {
    setIsCreating(true);
  }, []);

  React.useEffect(() => {
    if (searchParams.get('new') === 'true') {
      const handle = setTimeout(() => {
        openCreateModal();
        router.replace('/app/workspaces');
      }, 0);
      return () => clearTimeout(handle);
    }
  }, [searchParams, router, openCreateModal]);

  // Sync state when selection changes
  React.useEffect(() => {
    if (currentWorkspace) {
      const handle = setTimeout(() => {
        setBrandName(currentWorkspace.name);
        setWebsite(currentWorkspace.website ?? '');
        setTone((currentWorkspace.tone as ToneOption) ?? 'professional');
        setBrandVoice(currentWorkspace.brandVoice ?? '');
        setKeywords(currentWorkspace.keywords || []);
        setRules(currentWorkspace.rules || []);
        // reset scheduler inputs when workspace changes
        setNewScheduleLabel('');
        setNewScheduleDatetime('');
        setNewScheduleRecurrence('none');
        setNewSchedulePublishDraft(false);
        setDeleteWorkspaceError(null);
        setScheduleError(null);
        setDeleteScheduleError(null);
        setClientAllocationError(null);
      }, 0);
      return () => clearTimeout(handle);
    }
  }, [selectedWorkspaceId, currentWorkspace]);

  // Handle updates
  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || isSavingWorkspace) return;

    setEditValidationError(null);
    setBrandNameError(null);
    setWebsiteError(null);
    setBrandVoiceError(null);

    let hasError = false;

    // Validate name
    const nameErr = validateWorkspaceName(brandName);
    if (nameErr) {
      setBrandNameError(nameErr);
      hasError = true;
    }

    // Validate website
    const webErr = validateWebsiteUrl(website);
    if (webErr) {
      setWebsiteError(webErr);
      hasError = true;
    }

    // Validate brand voice description
    const voiceErr = validateBrandVoice(brandVoice);
    if (voiceErr) {
      setBrandVoiceError(voiceErr);
      hasError = true;
    }

    if (hasError) return;

    setIsSavingWorkspace(true);
    try {
      const updated: Workspace = {
        ...currentWorkspace,
        name: brandName,
        website: website || undefined,
        tone: tone as Workspace['tone'],
        brandVoice: brandVoice || undefined,
        keywords: keywords,
        rules: rules
      };

      await updateWorkspace(updated);
      fetchWorkspaces();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to update workspace. Please try again.';
      setEditValidationError(msg);
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);

  const handleDeleteWorkspace = async (id: string) => {
    if (isDeletingWorkspace) return;
    setIsDeletingWorkspace(true);
    setDeleteWorkspaceError(null);
    try {
      const remaining = workspaces.filter((w) => w.id !== id);
      if (selectedWorkspaceId === id) {
        setSelectedWorkspaceId(remaining[0]?.id ?? '');
      }
      await deleteWorkspace(id);
      setDeleteConfirmId(null);
      fetchWorkspaces();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to delete workspace. Please try again.';
      setDeleteWorkspaceError(msg);
    } finally {
      setIsDeletingWorkspace(false);
    }
  };

  const handleRemoveSchedule = async (id: string) => {
    if (!currentWorkspace || isDeletingSchedule) return;
    setIsDeletingSchedule(true);
    setDeleteScheduleError(null);
    try {
      await deleteWorkspaceSchedule(currentWorkspace.id, id);
      setScheduleDeleteConfirmId(null);
      fetchWorkspaces();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to remove schedule. Please try again.';
      setDeleteScheduleError(msg);
    } finally {
      setIsDeletingSchedule(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!currentWorkspace || isAddingSchedule) return;
    if (!newScheduleLabel.trim()) return;

    setIsAddingSchedule(true);
    setScheduleError(null);
    try {
      const newSched: Schedule = {
        id: `schedule-${Date.now()}`,
        label: newScheduleLabel,
        datetime: newScheduleDatetime || undefined,
        recurrence: newScheduleRecurrence,
        publishAsDraft: newSchedulePublishDraft,
        enabled: true,
        nextRun: newScheduleDatetime ? new Date(newScheduleDatetime).toISOString() : undefined,
      };

      await addWorkspaceSchedule(currentWorkspace.id, newSched);

      // Reset inputs
      setNewScheduleLabel('');
      setNewScheduleDatetime('');
      setNewScheduleRecurrence('none');
      setNewSchedulePublishDraft(false);
      fetchWorkspaces();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to add schedule. Please try again.';
      setScheduleError(msg);
    } finally {
      setIsAddingSchedule(false);
    }
  };

  // Remove Client Allocation (remove this workspace from client's assigned list)
  const handleDeallocateClient = async (client: ClientUser) => {
    if (!currentWorkspace || isDeallocatingClientId) return;
    setIsDeallocatingClientId(client.id);
    setClientAllocationError(null);
    try {
      await updateClient(client, { action: 'remove', workspaceId: currentWorkspace.id });
      fetchWorkspaces();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to remove client from workspace. Please try again.';
      setClientAllocationError(msg);
    } finally {
      setIsDeallocatingClientId(null);
    }
  };

  // Get allocated clients for current workspace
  const allocatedClients = (state.clients || []).filter((c) => {
    const wsIds = c.workspaceIds || (c.workspaceId ? [c.workspaceId] : []);
    return wsIds.includes(currentWorkspace?.id);
  });

  // Get clients eligible for allocation (not currently in this workspace)
  const unallocatedClients = (state.clients || []).filter((c) => {
    const wsIds = c.workspaceIds || (c.workspaceId ? [c.workspaceId] : []);
    return !wsIds.includes(currentWorkspace?.id);
  });

  if (isLoadingWorkspaces) {
    return <WorkspacesSkeleton />;
  }

  if (isClient) {
    return (
      <ClientWorkspaceView 
        currentWorkspace={currentWorkspace}
        allocatedClients={allocatedClients}
        currentUserEmail={state.currentUserEmail}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-text-primary">
      {/* Header */}
      <div className="border-b border-border-primary pb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Workspace Management</h1>
          <p className="text-sm text-text-secondary mt-1">
            Create, edit and manage brand voice settings, rules, and client allocations.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-instagram-pink text-white hover:opacity-90 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <span>New Workspace</span>
        </button>
      </div>

      {/* Create Workspace Panel Modal */}
      <CreateWorkspaceModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        state={state}
        addWorkspace={addWorkspace}
        updateClient={updateClient}
        updateState={updateState}
        setActiveWorkspace={setActiveWorkspace}
        setSelectedWorkspaceId={setSelectedWorkspaceId}
        fetchWorkspaces={fetchWorkspaces}
      />

      {/* Delete Confirmation Modals */}
      <WorkspaceDeleteModal
        isOpen={deleteConfirmId !== null}
        onClose={() => {
          setDeleteConfirmId(null);
          setDeleteWorkspaceError(null);
        }}
        workspaceName={workspaces.find(w => w.id === deleteConfirmId)?.name}
        onConfirm={async () => {
          if (deleteConfirmId) {
            await handleDeleteWorkspace(deleteConfirmId);
          }
        }}
        isDeleting={isDeletingWorkspace}
        error={deleteWorkspaceError}
      />

      <ScheduleDeleteModal
        isOpen={scheduleDeleteConfirmId !== null}
        onClose={() => {
          setScheduleDeleteConfirmId(null);
          setDeleteScheduleError(null);
        }}
        scheduleLabel={(currentWorkspace?.schedules || []).find(s => s.id === scheduleDeleteConfirmId)?.label}
        onConfirm={async () => {
          if (scheduleDeleteConfirmId) {
            await handleRemoveSchedule(scheduleDeleteConfirmId);
          }
        }}
        isDeleting={isDeletingSchedule}
        error={deleteScheduleError}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Workspace selector list */}
        <WorkspaceSelector
          workspaces={workspaces}
          selectedWorkspaceId={selectedWorkspaceId}
          setSelectedWorkspaceId={setSelectedWorkspaceId}
          clients={state.clients || []}
          accountType={state.accountType}
          onDeleteClick={setDeleteConfirmId}
        />

        {/* Right Column: Editing workspace details & Client allocation */}
        <div className="lg:col-span-9 space-y-6">
          {currentWorkspace ? (
            <>
              {/* Info panel */}
              <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] flex items-center justify-center text-white font-extrabold text-lg">
                    {currentWorkspace.name?.charAt(0) || 'W'}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">{currentWorkspace.name} Profile Details</h2>
                  </div>
                </div>
              </div>

              {/* Editing Forms */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Form fields */}
                <EditWorkspaceForm
                  brandName={brandName}
                  setBrandName={setBrandName}
                  website={website}
                  setWebsite={setWebsite}
                  tone={tone}
                  setTone={setTone}
                  brandVoice={brandVoice}
                  setBrandVoice={setBrandVoice}
                  keywords={keywords}
                  setKeywords={setKeywords}
                  rules={rules}
                  setRules={setRules}
                  isSavingWorkspace={isSavingWorkspace}
                  editValidationError={editValidationError}
                  brandNameError={brandNameError}
                  setBrandNameError={setBrandNameError}
                  websiteError={websiteError}
                  setWebsiteError={setWebsiteError}
                  brandVoiceError={brandVoiceError}
                  setBrandVoiceError={setBrandVoiceError}
                  onSubmit={handleUpdateWorkspace}
                />

                {/* Portal Members & Client Allocation */}
                <ClientAllocationCard
                  unallocatedClients={unallocatedClients}
                  allocatedClients={allocatedClients}
                  selectedClientToAllocate={selectedClientToAllocate}
                  setSelectedClientToAllocate={setSelectedClientToAllocate}
                  isAddingClient={isAddingClient}
                  isDeallocatingClientId={isDeallocatingClientId}
                  clientAllocationError={clientAllocationError}
                  onAllocate={async () => {
                    if (!selectedClientToAllocate || isAddingClient) return;
                    setIsAddingClient(true);
                    setClientAllocationError(null);
                    try {
                      const client = state.clients.find(c => c.id === selectedClientToAllocate);
                      if (client && currentWorkspace) {
                        await updateClient(client, { action: 'add', workspaceId: currentWorkspace.id });
                        setSelectedClientToAllocate('');
                        fetchWorkspaces();
                      }
                    } catch (err) {
                      console.error(err);
                      const msg = err instanceof Error ? err.message : 'Failed to assign client to workspace. Please try again.';
                      setClientAllocationError(msg);
                    } finally {
                      setIsAddingClient(false);
                    }
                  }}
                  onDeallocate={handleDeallocateClient}
                />

              </div>

              {/* Workspace Scheduler */}
              <WorkspaceSchedulerCard
                currentWorkspace={currentWorkspace}
                scheduleError={scheduleError}
                newScheduleLabel={newScheduleLabel}
                setNewScheduleLabel={setNewScheduleLabel}
                newScheduleDatetime={newScheduleDatetime}
                setNewScheduleDatetime={setNewScheduleDatetime}
                newScheduleRecurrence={newScheduleRecurrence}
                setNewScheduleRecurrence={setNewScheduleRecurrence}
                newSchedulePublishDraft={newSchedulePublishDraft}
                setNewSchedulePublishDraft={setNewSchedulePublishDraft}
                isAddingSchedule={isAddingSchedule}
                onAddSchedule={handleAddSchedule}
                onDeleteClick={setScheduleDeleteConfirmId}
              />
            </>
          ) : (
            <div className="bg-bg-card border border-border-primary rounded-2xl p-10 text-center text-text-secondary italic text-xs">
              No workspaces available. Create a new workspace to start.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
