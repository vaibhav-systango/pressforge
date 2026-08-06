'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Building, X, Users, ChevronDown, ShieldCheck, Layers, Plus } from 'lucide-react';
import { Select } from '@/components/common/select';
import type { Workspace, ClientUser, AppState } from '@/lib/types';
import { 
  validateWorkspaceName, 
  validateWebsiteUrl, 
  validateKeyword, 
  validateRule, 
  validateBrandVoice 
} from '@/lib/utils/validation';

const TONES = ['professional', 'friendly', 'witty', 'bold', 'empathetic'] as const;

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  addWorkspace: (w: Workspace) => Promise<{ workspace: Workspace } | void>;
  updateClient: (c: ClientUser) => Promise<unknown>;
  updateState: (s: Partial<AppState>) => Promise<unknown>;
  setActiveWorkspace: (id: string | null) => Promise<unknown>;
  setSelectedWorkspaceId: (id: string) => void;
  fetchWorkspaces: () => void;
}

export function CreateWorkspaceModal({
  isOpen,
  onClose,
  state,
  addWorkspace,
  updateClient,
  updateState,
  setActiveWorkspace,
  setSelectedWorkspaceId,
  fetchWorkspaces,
}: CreateWorkspaceModalProps) {
  const [mounted, setMounted] = useState(false);

  // Form states
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceWebsite, setNewWorkspaceWebsite] = useState('');
  const [newWorkspaceTone, setNewWorkspaceTone] = useState('professional');
  const [newWorkspaceBrandVoice, setNewWorkspaceBrandVoice] = useState('');
  const [newKeywords, setNewKeywords] = useState<string[]>([]);
  const [newRules, setNewRules] = useState<string[]>([]);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [newRuleInput, setNewRuleInput] = useState('');

  // Dropdown states
  const [selectedModalClientId, setSelectedModalClientId] = useState('');
  const [showModalClientDropdown, setShowModalClientDropdown] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [visibleClientsCount, setVisibleClientsCount] = useState(10);
  const [isLoadingMoreClients, setIsLoadingMoreClients] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // Errors
  const [validationError, setValidationError] = useState<string | null>(null);
  const [newBrandNameError, setNewBrandNameError] = useState<string | null>(null);
  const [newWebsiteError, setNewWebsiteError] = useState<string | null>(null);
  const [newBrandVoiceError, setNewBrandVoiceError] = useState<string | null>(null);
  const [newKeywordError, setNewKeywordError] = useState<string | null>(null);
  const [newRuleError, setNewRuleError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Initialize selected client when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedModalClientId(state.activeClientId || '');
      setClientSearchQuery('');
      setVisibleClientsCount(10);
      setIsLoadingMoreClients(false);
      setShowModalClientDropdown(false);
      setValidationError(null);
      
      // Reset form states
      setNewWorkspaceName('');
      setNewWorkspaceWebsite('');
      setNewWorkspaceTone('professional');
      setNewWorkspaceBrandVoice('');
      setNewKeywords([]);
      setNewRules([]);
      setNewKeywordInput('');
      setNewRuleInput('');
      setNewBrandNameError(null);
      setNewWebsiteError(null);
      setNewBrandVoiceError(null);
      setNewKeywordError(null);
      setNewRuleError(null);
    }
  }, [isOpen, state.activeClientId]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Click outside client dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModalClientDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const filteredClients = (state.clients || []).filter((c: ClientUser) => 
    (c.name || '').toLowerCase().includes(clientSearchQuery.toLowerCase()) || 
    (c.email || '').toLowerCase().includes(clientSearchQuery.toLowerCase())
  );

  const handleDropdownScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      if (visibleClientsCount < filteredClients.length && !isLoadingMoreClients) {
        setIsLoadingMoreClients(true);
        setTimeout(() => {
          setVisibleClientsCount(prev => Math.min(prev + 10, filteredClients.length));
          setIsLoadingMoreClients(false);
        }, 300);
      }
    }
  };

  const selectedClientObj = state.clients?.find((c: ClientUser) => c.id === selectedModalClientId);

  const handleCreateWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setNewBrandNameError(null);
    setNewWebsiteError(null);
    setNewBrandVoiceError(null);

    let hasError = false;

    // Validate name
    const nameErr = validateWorkspaceName(newWorkspaceName);
    if (nameErr) {
      setNewBrandNameError(nameErr);
      hasError = true;
    }

    // Validate website
    const webErr = validateWebsiteUrl(newWorkspaceWebsite);
    if (webErr) {
      setNewWebsiteError(webErr);
      hasError = true;
    }

    // Validate brand voice description
    const voiceErr = validateBrandVoice(newWorkspaceBrandVoice);
    if (voiceErr) {
      setNewBrandVoiceError(voiceErr);
      hasError = true;
    }

    if (state.currentUserType !== 'individual' && !selectedModalClientId) {
      setValidationError('Please select a client to assign this workspace.');
      hasError = true;
    }

    if (hasError) return;

    setIsCreatingWorkspace(true);

    const newId = `workspace-${Date.now()}`;
    const newWs: Workspace = {
      id: newId,
      name: newWorkspaceName,
      website: newWorkspaceWebsite || undefined,
      tone: newWorkspaceTone as Workspace['tone'],
      brandVoice: newWorkspaceBrandVoice || undefined,
      keywords: newKeywords.length > 0 ? newKeywords : [],
      rules: newRules.length > 0 ? newRules : [],
      schedules: []
    };

    try {
      const createdWs = await addWorkspace(newWs);
      const wsId = createdWs?.workspace?.id || newId;

      if (state.currentUserType !== 'individual' && selectedModalClientId) {
        const client = state.clients.find((c: ClientUser) => c.id === selectedModalClientId);
        if (client) {
          await updateClient({
            ...client,
            workspaceId: wsId
          });
          await updateState({ activeClientId: selectedModalClientId });
        }
      }

      await setActiveWorkspace(wsId);
      setSelectedWorkspaceId(wsId);
      onClose();
      fetchWorkspaces();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to create workspace. Please try again.';
      setValidationError(msg);
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div 
        ref={modalRef}
        className="bg-bg-card border border-border-primary w-full max-w-lg rounded-2xl shadow-xl animate-scale-up max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-border-primary shrink-0">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-instagram-pink" />
            <span className="font-bold text-text-primary">Create Brand Workspace</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-bg-hover rounded-lg text-text-secondary transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateWorkspaceSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* ── Workspace Details ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary">Workspace / Brand Name</label>
            <input
              type="text"
              required
              placeholder="e.g. EcoLife Co"
              value={newWorkspaceName}
              onChange={(e) => {
                setNewWorkspaceName(e.target.value.replace(/[^a-zA-Z0-9\s_-]/g, ''));
                setNewBrandNameError(null);
              }}
              onBlur={() => {
                setNewBrandNameError(validateWorkspaceName(newWorkspaceName));
              }}
              className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs focus:border-instagram-pink outline-none transition"
            />
            {newBrandNameError && (
              <p className="text-[10px] text-red-500 font-semibold">{newBrandNameError}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary">Website URL (Optional)</label>
            <input
              type="url"
              placeholder="https://ecolife.co"
              value={newWorkspaceWebsite}
              onChange={(e) => {
                setNewWorkspaceWebsite(e.target.value);
                setNewWebsiteError(null);
              }}
              onBlur={() => {
                setNewWebsiteError(validateWebsiteUrl(newWorkspaceWebsite));
              }}
              className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs focus:border-instagram-pink outline-none transition"
            />
            {newWebsiteError && (
              <p className="text-[10px] text-red-500 font-semibold">{newWebsiteError}</p>
            )}
          </div>

          {state.currentUserType !== 'individual' && (
            <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
              <label className="text-xs font-bold text-text-secondary">Assign to Client</label>
              <button
                type="button"
                onClick={() => setShowModalClientDropdown(!showModalClientDropdown)}
                className={`flex items-center justify-between border bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-xs hover:border-border-hover transition outline-none text-left w-full cursor-pointer ${
                  validationError && !selectedModalClientId ? 'border-red-500 focus:border-red-500' : 'border-border-primary'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Users className="w-4 h-4 text-text-secondary shrink-0" />
                  <span className="truncate">
                    {selectedClientObj 
                      ? `${selectedClientObj.name} (${selectedClientObj.email})`
                      : "Select Client"
                    }
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform ${showModalClientDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showModalClientDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border-primary rounded-xl shadow-lg z-50 p-2 space-y-2 animate-scale-up max-h-60 flex flex-col">
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search active clients..."
                      value={clientSearchQuery}
                      onChange={(e) => {
                        setClientSearchQuery(e.target.value);
                        setVisibleClientsCount(10);
                      }}
                      className="w-full border border-border-primary bg-bg-app text-text-primary rounded-lg pl-8 pr-3 py-1.5 text-xs focus:border-instagram-pink outline-none transition"
                    />
                    <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                  </div>

                  {/* Client List */}
                  <div 
                    onScroll={handleDropdownScroll}
                    className="overflow-y-auto flex-1 max-h-40 pr-1 select-none custom-scrollbar flex flex-col gap-1"
                  >
                    {filteredClients.length === 0 ? (
                      <div className="py-4 text-center text-xs text-text-secondary">
                        No clients found
                      </div>
                    ) : (
                      filteredClients.slice(0, visibleClientsCount).map((c: ClientUser) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedModalClientId(c.id);
                            setShowModalClientDropdown(false);
                            setValidationError(null);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-lg transition flex items-center justify-between cursor-pointer ${
                            selectedModalClientId === c.id 
                              ? 'bg-instagram-pink/10 text-instagram-pink font-semibold' 
                              : 'text-text-primary hover:bg-bg-hover'
                          }`}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold truncate">{c.name}</span>
                            <span className="text-[10px] text-text-secondary truncate">{c.email}</span>
                          </div>
                          {selectedModalClientId === c.id && (
                            <ShieldCheck className="w-4 h-4 text-instagram-pink shrink-0 ml-2" />
                          )}
                        </button>
                      ))
                    )}
                    {isLoadingMoreClients && (
                      <div className="py-2 text-center text-[10px] text-text-secondary flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 bg-instagram-pink rounded-full animate-ping"></span>
                        Loading more...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Brand Voice ── */}
          <div className="border-t border-border-primary pt-4 mt-2">
            <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5 mb-3">
              <Layers className="w-3.5 h-3.5 text-instagram-pink" />
              <span>Brand Voice</span>
            </h4>

            <div className="flex flex-col gap-2 mb-3">
              <Select
                label="Active Tone"
                value={newWorkspaceTone}
                onChange={(e) => setNewWorkspaceTone(e.target.value)}
                options={TONES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
                className="py-2.5 text-xs"
              />
            </div>

            {/* Brand Voice Guidelines */}
            <div className="flex flex-col gap-1.5 mb-3">
              <label className="text-xs font-bold text-text-secondary">Brand Voice Guidelines / Description</label>
              <textarea
                placeholder="Describe your brand voice, formatting requirements, or guidelines..."
                value={newWorkspaceBrandVoice}
                onChange={(e) => {
                  setNewWorkspaceBrandVoice(e.target.value);
                  setNewBrandVoiceError(null);
                }}
                onBlur={() => {
                  setNewBrandVoiceError(validateBrandVoice(newWorkspaceBrandVoice));
                }}
                rows={3}
                className="w-full border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-2 text-xs focus:border-instagram-pink outline-none resize-none transition"
              />
              {newBrandVoiceError && (
                <p className="text-[10px] text-red-500 font-semibold mt-0.5">{newBrandVoiceError}</p>
              )}
            </div>

            {/* Keywords */}
            <div className="flex flex-col gap-1.5 mb-3">
              <label className="text-xs font-bold text-text-secondary">Brand Keywords</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add keyword"
                  value={newKeywordInput}
                  onChange={(e) => {
                    setNewKeywordInput(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''));
                    setNewKeywordError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setNewKeywordError(null);
                      const clean = newKeywordInput.trim();
                      const err = validateKeyword(clean);
                      if (err) {
                        setNewKeywordError(err);
                        return;
                      }
                      if (newKeywords.includes(clean.toLowerCase())) {
                        setNewKeywordError('Keyword already exists');
                        return;
                      }
                      setNewKeywords([...newKeywords, clean.toLowerCase()]);
                      setNewKeywordInput('');
                    }
                  }}
                  onBlur={() => {
                    if (newKeywordInput.trim()) {
                      setNewKeywordError(validateKeyword(newKeywordInput.trim()));
                    }
                  }}
                  className="flex-1 border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-1.5 text-xs focus:border-instagram-pink outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setNewKeywordError(null);
                    const clean = newKeywordInput.trim();
                    const err = validateKeyword(clean);
                    if (err) {
                      setNewKeywordError(err);
                      return;
                    }
                    if (newKeywords.includes(clean.toLowerCase())) {
                      setNewKeywordError('Keyword already exists');
                      return;
                    }
                    setNewKeywords([...newKeywords, clean.toLowerCase()]);
                    setNewKeywordInput('');
                  }}
                  className="bg-bg-hover hover:bg-slate-200 border border-border-primary px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Add
                </button>
              </div>
              {newKeywordError && (
                <p className="text-[10px] text-red-500 font-semibold mt-0.5">{newKeywordError}</p>
              )}
              {newKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {newKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 bg-bg-app border border-border-primary rounded-full px-2.5 py-0.5 text-xs text-text-primary"
                    >
                      <span className="break-all">#{kw}</span>
                      <button type="button" onClick={() => setNewKeywords(newKeywords.filter(k => k !== kw))}>
                        <X className="w-3 h-3 text-text-secondary hover:text-text-primary" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Rules */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">Writing Prompt Rules</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Always capitalize PR title"
                  value={newRuleInput}
                  onChange={(e) => {
                    setNewRuleInput(e.target.value);
                    setNewRuleError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setNewRuleError(null);
                      const clean = newRuleInput.trim();
                      const err = validateRule(clean);
                      if (err) {
                        setNewRuleError(err);
                        return;
                      }
                      if (newRules.includes(clean)) {
                        setNewRuleError('Rule already exists');
                        return;
                      }
                      setNewRules([...newRules, clean]);
                      setNewRuleInput('');
                    }
                  }}
                  onBlur={() => {
                    if (newRuleInput.trim()) {
                      setNewRuleError(validateRule(newRuleInput.trim()));
                    }
                  }}
                  className="flex-1 border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-1.5 text-xs focus:border-instagram-pink outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setNewRuleError(null);
                    const clean = newRuleInput.trim();
                    const err = validateRule(clean);
                    if (err) {
                      setNewRuleError(err);
                      return;
                    }
                    if (newRules.includes(clean)) {
                      setNewRuleError('Rule already exists');
                      return;
                    }
                    setNewRules([...newRules, clean]);
                    setNewRuleInput('');
                  }}
                  className="bg-bg-hover hover:bg-slate-200 border border-border-primary px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Add
                </button>
              </div>
              {newRuleError && (
                <p className="text-[10px] text-red-500 font-semibold mt-0.5">{newRuleError}</p>
              )}
              {newRules.length > 0 && (
                <ul className="flex flex-col gap-1.5 mt-1.5">
                  {newRules.map((rule) => (
                    <li
                      key={rule}
                      className="flex items-center justify-between bg-bg-app border border-border-primary rounded-xl px-3 py-1.5 text-xs text-text-primary"
                    >
                      <span className="break-all pr-2">{rule}</span>
                      <button type="button" onClick={() => setNewRules(newRules.filter(r => r !== rule))} className="shrink-0">
                        <X className="w-3.5 h-3.5 text-text-secondary hover:text-text-primary" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {validationError && (
            <div className="text-xs text-red-500 font-semibold mt-2 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 py-2.5 rounded-xl">
              {validationError}
            </div>
          )}

          <button
            type="submit"
            disabled={isCreatingWorkspace}
            className={`w-full bg-text-primary text-bg-card hover:opacity-90 py-2.5 rounded-xl text-xs font-bold transition mt-6 flex items-center justify-center gap-2 ${isCreatingWorkspace ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isCreatingWorkspace && (
              <span className="w-4 h-4 border-2 border-bg-card/30 border-t-bg-card rounded-full animate-spin" />
            )}
            {isCreatingWorkspace ? 'Creating...' : 'Create Workspace'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
