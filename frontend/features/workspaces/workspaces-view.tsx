'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import React, { useState } from 'react';
import { 
  Building, Plus, Trash2, Edit3, Save, X, 
  Users, ArrowRight, ShieldCheck, HelpCircle, 
  Layers, ExternalLink, Globe, FileText, Calendar, Clock, Repeat
} from 'lucide-react';
import type { Workspace, ClientUser, Schedule } from '@/lib/data/mock-data';

const TONES = ['professional', 'friendly', 'witty', 'bold', 'empathetic'];

export function WorkspacesView() {
  const { 
    state, 
    updateState,
    addWorkspace, 
    updateWorkspace, 
    deleteWorkspace, 
    updateClient,
    addWorkspaceSchedule, 
    updateWorkspaceSchedule, 
    deleteWorkspaceSchedule 
  } = useAppState();
  const isClient = state.currentUserType === 'client';

  // If Client, default to their assigned workspace. Otherwise default to activeWorkspaceId or first workspace
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(
    isClient 
      ? (state.activeWorkspaceId || state.workspaces[0]?.id || '')
      : (state.activeWorkspaceId || state.workspaces[0]?.id || '')
  );

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Workspace forms states
  const [isCreating, setIsCreating] = useState(false);

  React.useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsCreating(true);
      router.replace('/app/workspaces');
    }
  }, [searchParams, router]);

  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceWebsite, setNewWorkspaceWebsite] = useState('');
  const [newWorkspaceTone, setNewWorkspaceTone] = useState('professional');
  
  // Selected workspace values
  const currentWorkspace = state.workspaces.find((w) => w.id === selectedWorkspaceId) || state.workspaces[0];
  
  // Edit state
  const [brandName, setBrandName] = useState(currentWorkspace?.name || '');
  const [website, setWebsite] = useState(currentWorkspace?.website || '');
  const [tone, setTone] = useState(currentWorkspace?.tone || 'professional');
  const [keywords, setKeywords] = useState<string[]>(currentWorkspace?.keywords || []);
  const [rules, setRules] = useState<string[]>(currentWorkspace?.rules || []);
  
  // Input fields
  const [keywordInput, setKeywordInput] = useState('');
  const [ruleInput, setRuleInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Scheduler local form state
  const [newScheduleLabel, setNewScheduleLabel] = useState('');
  const [newScheduleDatetime, setNewScheduleDatetime] = useState('');
  const [newScheduleRecurrence, setNewScheduleRecurrence] = useState<'none'|'daily'|'weekly'|'monthly'>('none');
  const [newSchedulePublishDraft, setNewSchedulePublishDraft] = useState(false);
  const [newScheduleEnabled, setNewScheduleEnabled] = useState(true);

  // Client allocation state
  const [selectedClientToAllocate, setSelectedClientToAllocate] = useState<string>('');

  // Sync state when selection changes
  React.useEffect(() => {
    if (currentWorkspace) {
      setBrandName(currentWorkspace.name);
      setWebsite(currentWorkspace.website);
      setTone(currentWorkspace.tone);
      setKeywords(currentWorkspace.keywords || []);
      setRules(currentWorkspace.rules || []);
      setSaveSuccess(false);
      // reset scheduler inputs when workspace changes
      setNewScheduleLabel('');
      setNewScheduleDatetime('');
      setNewScheduleRecurrence('none');
      setNewSchedulePublishDraft(false);
      setNewScheduleEnabled(true);
    }
  }, [selectedWorkspaceId, currentWorkspace]);

  // Handle updates
  const handleUpdateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;

    const updated: Workspace = {
      ...currentWorkspace,
      name: brandName,
      website: website,
      tone: tone as any,
      keywords: keywords,
      rules: rules
    };

    updateWorkspace(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Handle create
  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim() || !newWorkspaceWebsite.trim()) return;

    const newId = `workspace-${Date.now()}`;
    const newWs: Workspace = {
      id: newId,
      name: newWorkspaceName,
      website: newWorkspaceWebsite,
      tone: newWorkspaceTone as any,
      keywords: ['press', 'news'],
      rules: ['Write clearly and concisely.'],
      schedules: []
    };

    addWorkspace(newWs);
    setSelectedWorkspaceId(newId);
    setIsCreating(false);
    setNewWorkspaceName('');
    setNewWorkspaceWebsite('');
    setNewWorkspaceTone('professional');
  };

  const handleDeleteWorkspace = (id: string) => {
    deleteWorkspace(id);
    setDeleteConfirmId(null);
  };

  // Keywords CRUD
  const handleAddKeyword = () => {
    const clean = keywordInput.trim().toLowerCase();
    if (clean && !keywords.includes(clean)) {
      setKeywords([...keywords, clean]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  // Rules CRUD
  const handleAddRule = () => {
    const clean = ruleInput.trim();
    if (clean && !rules.includes(clean)) {
      setRules([...rules, clean]);
      setRuleInput('');
    }
  };

  const handleRemoveRule = (rule: string) => {
    setRules(rules.filter((r) => r !== rule));
  };

  const handleRemoveSchedule = (id: string) => {
    if (!currentWorkspace) return;
    deleteWorkspaceSchedule(currentWorkspace.id, id);
  };

  const handleAddSchedule = () => {
    if (!currentWorkspace) return;
    if (!newScheduleLabel.trim()) return;

    const newSched: Schedule = {
      id: `schedule-${Date.now()}`,
      label: newScheduleLabel,
      datetime: newScheduleDatetime || undefined,
      recurrence: newScheduleRecurrence,
      publishAsDraft: newSchedulePublishDraft,
      enabled: newScheduleEnabled,
      nextRun: newScheduleDatetime ? new Date(newScheduleDatetime).toISOString() : undefined,
    };

    addWorkspaceSchedule(currentWorkspace.id, newSched);

    // Reset inputs
    setNewScheduleLabel('');
    setNewScheduleDatetime('');
    setNewScheduleRecurrence('none');
    setNewSchedulePublishDraft(false);
    setNewScheduleEnabled(true);
  };

  // Remove Client Allocation (reset workspace to empty or default)
  const handleDeallocateClient = (client: ClientUser) => {
    const otherWorkspace = state.workspaces.find(w => w.id !== currentWorkspace.id);
    const updatedClient: ClientUser = {
      ...client,
      workspaceId: otherWorkspace ? otherWorkspace.id : ''
    };
    updateClient(updatedClient);
  };

  // Get allocated clients for current workspace
  const allocatedClients = (state.clients || []).filter(
    (c) => c.workspaceId === currentWorkspace?.id
  );

  // Get clients eligible for allocation (not currently in this workspace)
  const unallocatedClients = (state.clients || []).filter(
    (c) => c.workspaceId !== currentWorkspace?.id
  );

  if (isClient) {
    // Client View: Read-Only Workspace details and tone profile
    return (
      <div className="flex flex-col gap-6 animate-fade-in text-text-primary">
        {/* Header */}
        <div className="border-b border-border-primary pb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] flex items-center justify-center text-white font-extrabold text-lg shadow animate-pulse">
              {currentWorkspace?.name?.charAt(0) || 'W'}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{currentWorkspace?.name} Profile</h1>
              <p className="text-sm text-text-secondary mt-1">
                View your active brand guidelines, keywords, and tone settings.
              </p>
            </div>
          </div>

          <Link 
            href="/app/content/new"
            className="bg-instagram-pink text-white hover:opacity-90 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Post</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-text-primary border-b border-border-primary pb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-instagram-pink" />
                <span>Brand Identity Details</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-text-secondary font-bold uppercase">Brand Website</span>
                  <div className="flex items-center gap-1.5 text-text-primary">
                    <span className="font-semibold">{currentWorkspace?.website}</span>
                    <a 
                      href={currentWorkspace?.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-instagram-pink hover:opacity-85"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-text-secondary font-bold uppercase">Active Writing Tone</span>
                  <p className="font-semibold capitalize text-text-primary">{currentWorkspace?.tone}</p>
                </div>
              </div>
            </div>

            {/* Scheduler (client view) */}
            <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-instagram-pink" /> Workspace Scheduler
              </h4>

              <div className="mt-3 space-y-2">
                {(currentWorkspace.schedules || []).length === 0 && (
                  <p className="text-xs text-text-secondary italic">No schedules configured for this workspace.</p>
                )}

                {(currentWorkspace.schedules || []).map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 bg-bg-app/30 border border-border-primary rounded-lg px-3 py-2 text-xs">
                    <div>
                      <div className="font-bold text-text-primary">{s.label}</div>
                      <div className="text-[11px] text-text-secondary">{s.nextRun ? new Date(s.nextRun).toLocaleString() : (s.datetime ? new Date(s.datetime).toLocaleString() : '—')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[11px] text-text-secondary">{s.recurrence || 'one-time'}</div>
                      <button onClick={() => handleRemoveSchedule(s.id)} className="text-red-500 text-xs font-bold">Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                <div className="md:col-span-2">
                  <label className="text-[10px] text-text-secondary">Label</label>
                  <input value={newScheduleLabel} onChange={(e) => setNewScheduleLabel(e.target.value)} placeholder="e.g. Monday Post" className="w-full border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-2 text-xs outline-none" />
                </div>

                <div>
                  <label className="text-[10px] text-text-secondary">When</label>
                  <input type="datetime-local" value={newScheduleDatetime} onChange={(e) => setNewScheduleDatetime(e.target.value)} className="w-full border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-2 text-xs outline-none" />
                </div>

                <div>
                  <label className="text-[10px] text-text-secondary">Recurrence</label>
                  <select value={newScheduleRecurrence} onChange={(e) => setNewScheduleRecurrence(e.target.value as any)} className="w-full border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-2 text-xs outline-none">
                    <option value="none">None (one-time)</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-text-secondary">Publish Mode</label>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-text-secondary">Draft</label>
                    <input type="checkbox" checked={newSchedulePublishDraft} onChange={(e) => setNewSchedulePublishDraft(e.target.checked)} />
                  </div>
                  <button onClick={handleAddSchedule} className="ml-auto bg-instagram-pink text-white px-3 py-1.5 rounded-xl text-xs font-bold">Add Schedule</button>
                </div>
              </div>
            </div>

            {/* Keywords and Rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Active Keywords</h4>
                <div className="flex flex-wrap gap-1.5">
                  {currentWorkspace?.keywords?.map((kw) => (
                    <span
                      key={kw}
                      className="bg-bg-app border border-border-primary rounded-full px-3 py-1 text-xs text-text-primary font-medium"
                    >
                      #{kw}
                    </span>
                  ))}
                  {(!currentWorkspace?.keywords || currentWorkspace.keywords.length === 0) && (
                    <span className="text-text-secondary italic">No active keywords configured.</span>
                  )}
                </div>
              </div>

              <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">System Writing Rules</h4>
                <ul className="space-y-2">
                  {currentWorkspace?.rules?.map((rule, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 bg-bg-app/40 border border-border-primary rounded-xl px-3 py-2 text-xs text-text-primary"
                    >
                      <FileText className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                  {(!currentWorkspace?.rules || currentWorkspace.rules.length === 0) && (
                    <li className="text-text-secondary italic">No system writing rules configured.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar Portal Members Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-text-primary border-b border-border-primary pb-2 flex items-center gap-1.5">
                <Users className="w-4.5 h-4.5 text-instagram-pink" />
                <span>Portal Members</span>
              </h3>
              <p className="text-xs text-text-secondary">
                The following client portal users have access to review and approve drafts for this brand:
              </p>

              <div className="space-y-2.5">
                {allocatedClients.map((client) => (
                  <div key={client.id} className="p-3 bg-bg-app/40 rounded-xl border border-border-primary flex flex-col gap-1 text-xs">
                    <p className="font-bold text-text-primary">{client.name} {client.id === state.currentUserEmail && '(You)'}</p>
                    <p className="text-text-secondary text-[11px]">{client.email}</p>
                    <span className="inline-block self-start mt-1 text-[9px] bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900 px-2 py-0.5 rounded-full font-bold uppercase">
                      {client.status}
                    </span>
                  </div>
                ))}

                {allocatedClients.length === 0 && (
                  <p className="text-xs text-text-secondary italic text-center py-4">
                    No portal members listed.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Agency View: Full Workspace CRUD and allocation management
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
          onClick={() => setIsCreating(true)}
          className="bg-instagram-pink text-white hover:opacity-90 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Workspace</span>
        </button>
      </div>

      {/* Create Workspace Panel Modal/Overlay */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-primary w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between p-5 border-b border-border-primary">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-instagram-pink" />
                <span className="font-bold text-text-primary">Create Brand Workspace</span>
              </div>
              <button 
                onClick={() => setIsCreating(false)}
                className="p-1 hover:bg-bg-hover rounded-lg text-text-secondary transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="p-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-secondary">Workspace / Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EcoLife Co"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs focus:border-instagram-pink outline-none transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-secondary">Website URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://ecolife.co"
                  value={newWorkspaceWebsite}
                  onChange={(e) => setNewWorkspaceWebsite(e.target.value)}
                  className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs focus:border-instagram-pink outline-none transition"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary">Active Tone</label>
                <select
                  value={newWorkspaceTone}
                  onChange={(e) => setNewWorkspaceTone(e.target.value)}
                  className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-2.5 text-xs focus:border-instagram-pink outline-none"
                >
                  {TONES.map(t => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-text-primary text-bg-card hover:opacity-90 py-2.5 rounded-xl text-xs font-bold transition mt-6"
              >
                Create Workspace
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Workspace selector list */}
        <div className="lg:col-span-3 bg-bg-card border border-border-primary rounded-2xl p-4 shadow-sm space-y-3">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider border-b border-border-primary pb-2 block">
            Workspaces ({state.workspaces.length})
          </span>

          <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto pr-1">
            {state.workspaces.map((ws) => {
              const isSelected = ws.id === selectedWorkspaceId;
              const wsClients = (state.clients || []).filter(c => c.workspaceId === ws.id);

              return (
                <div key={ws.id} className="relative group/item">
                  <button
                    onClick={() => {
                      setSelectedWorkspaceId(ws.id);
                      updateState({ activeWorkspaceId: ws.id });
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                      isSelected 
                        ? 'border-instagram-pink bg-pink-50/20 text-text-primary' 
                        : 'border-border-primary hover:bg-bg-hover text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden pr-6">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0 text-text-primary">
                        {ws.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">{ws.name}</p>
                        {state.accountType !== 'individual' && (
                          <p className="text-[10px] text-text-secondary mt-0.5">{wsClients.length} portal users</p>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Delete button shown on hover/select */}
                  {state.workspaces.length > 1 && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 transition duration-150">
                      {deleteConfirmId === ws.id ? (
                        <div className="flex items-center bg-bg-card border border-red-500 rounded-lg p-1 gap-1 text-[9px] font-bold shadow-md">
                          <button
                            onClick={() => handleDeleteWorkspace(ws.id)}
                            className="bg-red-500 hover:opacity-90 text-white px-1.5 py-0.5 rounded"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-text-primary px-1.5 py-0.5 rounded"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(ws.id)}
                          title="Delete Workspace"
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Editing workspace details & Client allocation */}
        <div className="lg:col-span-9 space-y-6">
          {currentWorkspace ? (
            <>
              {/* Info panel */}
              <div className="bg-bg-card border border-border-primary rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] flex items-center justify-center text-white font-extrabold text-lg">
                    {brandName?.charAt(0) || 'W'}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">{brandName} Profile Details</h2>
                    <p className="text-xs text-text-secondary">Workspace ID: {currentWorkspace.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link 
                    href="/app/analytics"
                    className="text-xs font-bold text-text-primary bg-bg-app border border-border-primary hover:bg-bg-hover px-3.5 py-2 rounded-xl transition"
                  >
                    View Analytics
                  </Link>
                  <Link 
                    href="/app/content/new"
                    className="text-xs font-bold text-white bg-instagram-pink hover:opacity-90 px-3.5 py-2 rounded-xl transition"
                  >
                    Create Post
                  </Link>
                </div>
              </div>

              {/* Editing Forms */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Form fields */}
                <div className="md:col-span-7 bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm">
                  <form onSubmit={handleUpdateWorkspace} className="space-y-6">
                    <h3 className="text-sm font-bold text-text-primary border-b border-border-primary pb-2 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-text-secondary" />
                      <span>Workspace Properties</span>
                    </h3>

                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text-secondary" htmlFor="brand-name">
                        Workspace / Brand Name
                      </label>
                      <input
                        id="brand-name"
                        type="text"
                        required
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs focus:border-instagram-pink outline-none transition"
                      />
                    </div>

                    {/* Website */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text-secondary" htmlFor="website">
                        Website URL
                      </label>
                      <input
                        id="website"
                        type="url"
                        required
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs focus:border-instagram-pink outline-none transition"
                      />
                    </div>

                    {/* Tone */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-text-secondary">Active Writing Tone</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {TONES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTone(t)}
                            className={`border py-2 px-1 rounded-xl text-[10px] font-bold capitalize transition duration-150 cursor-pointer ${
                              tone === t
                                ? 'border-instagram-pink text-instagram-pink bg-pink-50 dark:bg-pink-950/20'
                                : 'border-border-primary text-text-secondary hover:bg-bg-hover'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {saveSuccess ? (
                      <div className="flex items-center justify-center gap-1.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 py-3 rounded-xl text-xs font-bold transition">
                        <ShieldCheck className="w-4 h-4" /> Workspace updated successfully
                      </div>
                    ) : (
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-1.5 bg-text-primary hover:opacity-90 text-bg-card py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Workspace settings</span>
                      </button>
                    )}
                  </form>
                </div>

                {/* Guidelines: Keywords & Rules */}
                <div className="md:col-span-5 bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-6">
                  <h3 className="text-sm font-bold text-text-primary border-b border-border-primary pb-2 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-text-secondary" />
                    <span>Writing Guidelines</span>
                  </h3>

                  {/* Keywords */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Brand Keywords</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add tag"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddKeyword();
                          }
                        }}
                        className="flex-1 border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-1.5 text-xs focus:border-instagram-pink outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        className="bg-bg-hover hover:bg-slate-200 dark:hover:bg-slate-800 border border-border-primary px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2 max-h-[80px] overflow-y-auto pr-1">
                      {keywords.map((kw) => (
                        <span
                          key={kw}
                          className="inline-flex items-center gap-1 bg-bg-app border border-border-primary rounded-full px-2.5 py-0.5 text-xs text-text-primary"
                        >
                          <span>#{kw}</span>
                          <button type="button" onClick={() => handleRemoveKeyword(kw)}>
                            <X className="w-3 h-3 text-text-secondary hover:text-text-primary" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Rules */}
                  <div className="flex flex-col gap-1.5 pt-4 border-t border-border-primary">
                    <label className="text-xs font-semibold text-text-secondary">Writing Prompt Rules</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Always capitalize PR title"
                        value={ruleInput}
                        onChange={(e) => setRuleInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddRule();
                          }
                        }}
                        className="flex-1 border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-1.5 text-xs focus:border-instagram-pink outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddRule}
                        className="bg-bg-hover hover:bg-slate-200 dark:hover:bg-slate-800 border border-border-primary px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                    <ul className="flex flex-col gap-1.5 mt-2 max-h-[120px] overflow-y-auto pr-1">
                      {rules.map((rule) => (
                        <li
                          key={rule}
                          className="flex items-center justify-between bg-bg-app border border-border-primary rounded-xl px-3 py-1.5 text-xs text-text-primary"
                        >
                          <span className="truncate pr-2">{rule}</span>
                          <button type="button" onClick={() => handleRemoveRule(rule)} className="shrink-0">
                            <X className="w-3.5 h-3.5 text-text-secondary hover:text-text-primary" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>

              {/* Workspace Scheduler */}
              <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-primary pb-3.5">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <Calendar className="w-4.5 h-4.5 text-instagram-pink" />
                      <span>Workspace Scheduler</span>
                    </h3>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      Configure automated publishing schedule windows for this brand workspace.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {(currentWorkspace.schedules || []).length === 0 && (
                    <p className="text-xs text-text-secondary italic">No schedules configured for this workspace.</p>
                  )}

                  {(currentWorkspace.schedules || []).map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 bg-bg-app/30 border border-border-primary rounded-lg px-3 py-2 text-xs">
                      <div>
                        <div className="font-bold text-text-primary">{s.label}</div>
                        <div className="text-[11px] text-text-secondary">
                          {s.nextRun ? new Date(s.nextRun).toLocaleString() : (s.datetime ? new Date(s.datetime).toLocaleString() : '—')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-bg-hover text-text-secondary uppercase font-semibold">
                          {s.recurrence || 'one-time'}
                        </span>
                        {s.publishAsDraft && (
                          <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase">
                            Draft Mode
                          </span>
                        )}
                        <button onClick={() => handleRemoveSchedule(s.id)} className="text-red-500 text-xs font-bold hover:underline ml-2">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-border-primary pt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="text-[10px] text-text-secondary font-bold uppercase block mb-1">Label</label>
                    <input 
                      value={newScheduleLabel} 
                      onChange={(e) => setNewScheduleLabel(e.target.value)} 
                      placeholder="e.g. Monday Morning Post" 
                      className="w-full border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-2 text-xs outline-none focus:border-instagram-pink transition" 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-text-secondary font-bold uppercase block mb-1">When</label>
                    <input 
                      type="datetime-local" 
                      value={newScheduleDatetime} 
                      onChange={(e) => setNewScheduleDatetime(e.target.value)} 
                      className="w-full border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-2 text-xs outline-none focus:border-instagram-pink transition" 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-text-secondary font-bold uppercase block mb-1">Recurrence</label>
                    <select 
                      value={newScheduleRecurrence} 
                      onChange={(e) => setNewScheduleRecurrence(e.target.value as any)} 
                      className="w-full border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-2.5 text-xs outline-none focus:border-instagram-pink transition"
                    >
                      <option value="none">None (one-time)</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div className="md:col-span-4 flex items-center justify-between mt-2 pt-2 border-t border-dashed border-border-primary">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="publish-draft-agency"
                        checked={newSchedulePublishDraft} 
                        onChange={(e) => setNewSchedulePublishDraft(e.target.checked)} 
                        className="rounded border-border-primary text-instagram-pink focus:ring-instagram-pink"
                      />
                      <label htmlFor="publish-draft-agency" className="text-xs text-text-secondary select-none">
                        Publish scheduled posts as <strong>Draft</strong> for review
                      </label>
                    </div>
                    <button 
                      type="button"
                      onClick={handleAddSchedule} 
                      className="bg-instagram-pink hover:opacity-90 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Schedule Window</span>
                    </button>
                  </div>
                </div>
              </div>
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

