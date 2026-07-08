'use client';

import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import { useAuth } from '@/lib/hooks/queries/use-auth';
import { useInviteMemberMutation } from '@/lib/hooks/mutations/use-invitation';
import { formatOrganizationRole, getInvitableRoles, resolveOrganizationRole, type InvitableRole } from '@/lib/invitations/role-hierarchy';
import { ApiError } from '@/lib/utils/api-errors';
import React, { useState } from 'react';
import type { ClientUser, MockEmail } from '@/lib/types';
import { 
  Users, Mail, ArrowRight, ShieldAlert, Building, X, Plus, 
  Edit3, Calendar, ShieldCheck, UserCheck, AlertTriangle, 
  Filter, Search, Key
} from 'lucide-react';

export function ClientsView() {
  const { state, updateState, acceptInvite, addClient, updateClient } = useAppState();
  const { user } = useAuth();
  const organizationId = user?.organizationId ?? null;
  const invitableRoles = getInvitableRoles(
    resolveOrganizationRole(user?.organizationRole, user?.accountType),
  );
  const inviteMutation = useInviteMemberMutation(organizationId ?? '');
  const router = useRouter();

  const isClient = state.currentUserType === 'client';
  const canInvite = Boolean(organizationId) && invitableRoles.length > 0;
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<'all' | 'Basic' | 'Pro' | 'Enterprise'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('all');

  // Form / Modal States
  const [isEditing, setIsEditing] = useState(false);
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);
  
  // Edit Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formWorkspaceId, setFormWorkspaceId] = useState('');
  const [formPlan, setFormPlan] = useState<'Basic' | 'Pro' | 'Enterprise'>('Pro');
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [formStatus, setFormStatus] = useState<'pending' | 'active' | 'expired'>('active');

  // Create Mode Form Fields
  const [isCreating, setIsCreating] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createWorkspaceId, setCreateWorkspaceId] = useState(state.workspaces[0]?.id || '');
  const [createPlan, setCreatePlan] = useState<'Basic' | 'Pro' | 'Enterprise'>('Pro');
  const [createExpiresAt, setCreateExpiresAt] = useState('');

  // Backend invitation form
  const [isInviting, setIsInviting] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<InvitableRole>('CLIENT');
  const [inviteError, setInviteError] = useState('');

  const selectedInviteRole: InvitableRole = invitableRoles.includes(inviteRole)
    ? inviteRole
    : (invitableRoles[0] ?? 'CLIENT');

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');

    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError('Please enter name and email.');
      return;
    }

    if (!organizationId) {
      setInviteError('Organization not found. Complete onboarding before inviting users.');
      return;
    }

    try {
      const invitation = await inviteMutation.mutateAsync({
        email: inviteEmail.trim(),
        fullName: inviteName.trim(),
        role: selectedInviteRole,
      });

      updateState((prev) => ({
        ...prev,
        clients: [
          ...(prev.clients || []),
          {
            id: invitation.id,
            name: invitation.fullName,
            email: invitation.email,
            workspaceId: prev.workspaces[0]?.id || '',
            password: '—',
            status: 'pending' as const,
            plan: 'Pro' as const,
          },
        ],
      }));

      setInviteName('');
      setInviteEmail('');
      setInviteRole(invitableRoles[0] ?? 'CLIENT');
      setIsInviting(false);

      notifications.show({
        title: 'Invitation sent',
        message: `An invite email was sent to ${invitation.email}.`,
        color: 'green',
      });
    } catch (error) {
      const apiError =
        error instanceof ApiError
          ? error
          : new ApiError('Failed to send invitation. Please try again.', 500, 'UNKNOWN');
      setInviteError(apiError.message);
      notifications.show({
        title: 'Invite failed',
        message: apiError.message,
        color: 'red',
      });
    }
  };

  // Handle Edit Action
  const startEdit = (client: ClientUser) => {
    setCurrentClientId(client.id);
    setFormName(client.name);
    setFormEmail(client.email);
    setFormPassword(client.password ?? '');
    setFormWorkspaceId(client.workspaceId);
    setFormPlan((client.plan as 'Basic' | 'Pro' | 'Enterprise') || 'Pro');
    setFormStatus(client.status === 'inactive' ? 'expired' : client.status);
    
    if (client.expiresAt) {
      setFormExpiresAt(client.expiresAt.substring(0, 10)); // Format YYYY-MM-DD
    } else {
      setFormExpiresAt('');
    }
    
    setIsEditing(true);
  };

  // Save Edit Changes
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClientId) return;

    const expiresIso = formExpiresAt ? new Date(formExpiresAt).toISOString() : undefined;
    
    const updatedUser: ClientUser = {
      id: currentClientId,
      name: formName.trim(),
      email: formEmail.trim(),
      password: formPassword.trim(),
      workspaceId: formWorkspaceId,
      status: formStatus,
      plan: formPlan,
      expiresAt: expiresIso
    };

    updateClient(updatedUser);
    setIsEditing(false);
    setCurrentClientId(null);
    alert('Client portal details updated successfully!');
  };

  // Handle Create Action
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createEmail.trim() || !createWorkspaceId) {
      alert('Please fill out all required fields.');
      return;
    }

    const password = 'pass_' + Math.random().toString(36).substring(2, 6);
    const expiresIso = createExpiresAt ? new Date(createExpiresAt).toISOString() : undefined;
    const workspace = state.workspaces.find(w => w.id === createWorkspaceId);
    const workspaceName = workspace ? workspace.name : 'your Brand';

    const newClient: ClientUser = {
      id: 'client-' + Date.now(),
      name: createName.trim(),
      email: createEmail.trim(),
      workspaceId: createWorkspaceId,
      password: password,
      status: 'pending',
      plan: createPlan,
      expiresAt: expiresIso
    };

    // Add client user to state
    addClient(newClient);

    // Create invite mock email
    const newEmail: MockEmail = {
      id: 'email-' + Date.now(),
      from: 'noreply@pressforge.ai',
      to: createEmail.trim(),
      subject: `Invite: Join client portal for ${workspaceName}`,
      preview: `Invitation to join ${workspaceName} on PressForge`,
      time: 'Just now',
      read: false,
      body: `Hi ${createName.trim()},\n\nYou have been invited to review content briefs and approvals for ${workspaceName} on PressForge.\n\nYour login details are:\nEmail/Username: ${createEmail.trim()}\nPassword: ${password}\n\nPlease accept the invitation and log in.`,
      timestamp: new Date().toISOString(),
      inviteLink: `/auth/accept-invite?email=${encodeURIComponent(createEmail.trim())}&password=${encodeURIComponent(password)}&workspaceId=${encodeURIComponent(createWorkspaceId)}`
    };

    updateState({ mockInbox: [newEmail, ...(state.mockInbox || [])] });

    setCreateName('');
    setCreateEmail('');
    setCreateExpiresAt('');
    setIsCreating(false);
    alert(`Client portal created and invitation email queued in Mock Inbox!`);
  };

  const handleAcceptInviteSimulated = (email: string, password: string, inviteLinkId: string) => {
    const client = state.clients.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (client) {
      acceptInvite(client.id);
      const mockEmail = state.mockInbox?.find(e => e.id === inviteLinkId);
      if (mockEmail?.inviteLink) {
        router.push(mockEmail.inviteLink);
      } else {
        router.push(`/auth/accept-invite?email=${encodeURIComponent(client.email)}&password=${encodeURIComponent(client.password ?? '')}&workspaceId=${encodeURIComponent(client.workspaceId)}`);
      }
    }
  };

  // Helper: check if a client subscription has expired
  const getComputedStatus = (client: ClientUser) => {
    if (client.status === 'expired') return 'expired';
    if (client.expiresAt && new Date(client.expiresAt) < new Date()) {
      return 'expired';
    }
    return client.status;
  };

  // Filter & Search Logic
  const filteredClients = (state.clients || []).filter(client => {
    const computedStatus = getComputedStatus(client);
    const clientWs = state.workspaces.find(w => w.id === client.workspaceId);
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (clientWs?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesPlan = selectedPlanFilter === 'all' || client.plan === selectedPlanFilter;
    const matchesStatus = selectedStatusFilter === 'all' || computedStatus === selectedStatusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  if (isClient) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/20 text-red-500 border border-red-100 dark:border-red-900/30 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Restricted Access</h2>
        <p className="text-sm text-text-secondary">
          Client portal users are not permitted to manage client portals or invite other users.
        </p>
        <button
          onClick={() => router.push('/app')}
          className="bg-instagram-pink text-white px-6 py-2 rounded-full text-xs font-bold hover:opacity-90 transition cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-6xl mx-auto w-full text-text-primary">
      {/* Header */}
      <div className="border-b border-border-primary pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-instagram-pink" />
            <span>Client Portals & Subscriptions</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Fully manage external client portal accounts, assign brand workspaces, track plans, and configure access expiry.
          </p>
        </div>

        <button
          onClick={() => (canInvite ? setIsInviting(true) : setIsCreating(true))}
          disabled={canInvite && inviteMutation.isPending}
          className="flex items-center gap-1.5 bg-instagram-pink text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer self-start disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
          <span>{canInvite ? 'Invite User' : 'New Client Portal'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-card border border-border-primary rounded-xl p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-text-secondary">Total Clients</span>
          <p className="text-2xl font-extrabold text-text-primary mt-1">{(state.clients || []).length}</p>
        </div>
        <div className="bg-bg-card border border-border-primary rounded-xl p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-text-secondary">Active Access</span>
          <p className="text-2xl font-extrabold text-green-600 mt-1">
            {(state.clients || []).filter(c => getComputedStatus(c) === 'active').length}
          </p>
        </div>
        <div className="bg-bg-card border border-border-primary rounded-xl p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-text-secondary">Pending Invites</span>
          <p className="text-2xl font-extrabold text-yellow-600 mt-1">
            {(state.clients || []).filter(c => getComputedStatus(c) === 'pending').length}
          </p>
        </div>
        <div className="bg-bg-card border border-border-primary rounded-xl p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-text-secondary">Expired Subscriptions</span>
          <p className="text-2xl font-extrabold text-red-500 mt-1">
            {(state.clients || []).filter(c => getComputedStatus(c) === 'expired').length}
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-bg-card border border-border-primary rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by client, email, workspace..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border-primary bg-bg-app text-text-primary rounded-xl text-xs focus:border-instagram-pink outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Plan Filter */}
          <select
            value={selectedPlanFilter}
            onChange={(e) => setSelectedPlanFilter(e.target.value as any)}
            className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-1.5 text-xs focus:border-instagram-pink outline-none"
          >
            <option value="all">All Plans</option>
            <option value="Basic">Basic</option>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
            className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-1.5 text-xs focus:border-instagram-pink outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main List Column */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Client List */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-text-primary border-b border-border-primary pb-2 flex items-center gap-1.5">
              <Users className="w-5 h-5 text-instagram-pink" />
              <span>Registered Clients ({filteredClients.length})</span>
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {filteredClients.map((client) => {
                const clientWs = state.workspaces.find(w => w.id === client.workspaceId);
                const computedStatus = getComputedStatus(client);
                
                const statusStyles = 
                  computedStatus === 'active' 
                    ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900 dark:text-green-400' 
                    : computedStatus === 'pending'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950/20 dark:border-yellow-900 dark:text-yellow-400'
                    : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400';

                const planStyles = 
                  client.plan === 'Enterprise'
                    ? 'bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:border-purple-900 dark:text-purple-400'
                    : client.plan === 'Pro'
                    ? 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-400'
                    : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-950/20 dark:border-slate-900 dark:text-slate-400';

                return (
                  <div key={client.id} className="border border-border-primary rounded-xl p-5 bg-bg-app/20 hover:border-slate-300 dark:hover:border-slate-800 transition duration-150 flex flex-col justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      
                      {/* Left: Info */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-base text-text-primary">{client.name}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${statusStyles}`}>
                            {computedStatus}
                          </span>
                          {client.plan && (
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${planStyles}`}>
                              {client.plan} Plan
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-text-secondary" />
                          <span>{client.email}</span>
                        </p>
                      </div>

                      {/* Right: edit only for demo mock clients */}
                      <div className="flex items-center gap-2 self-end sm:self-start">
                        <button
                          onClick={() => startEdit(client)}
                          title="Edit Client Access"
                          className="p-2 border border-border-primary bg-bg-card rounded-lg hover:border-instagram-pink hover:text-instagram-pink transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-border-primary border-dashed text-xs text-text-secondary">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-text-secondary mb-0.5">Brand Workspace</span>
                        <span className="font-semibold text-text-primary flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-text-secondary" />
                          {clientWs?.name || 'Unassigned'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-text-secondary mb-0.5">Demo Password</span>
                        <span className="font-mono bg-bg-card px-2 py-0.5 rounded border border-border-primary text-instagram-pink font-semibold flex items-center gap-1 w-max">
                          <Key className="w-3 h-3" />
                          {client.password}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-text-secondary mb-0.5">Access Expires</span>
                        <span className="font-semibold text-text-primary flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                          {client.expiresAt 
                            ? new Date(client.expiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                            : 'Never Expire'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredClients.length === 0 && (
                <div className="text-center py-12 text-text-secondary italic text-sm">
                  No clients match the selected search or filter criteria.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Side Forms / Inbox */}
        <div className="lg:col-span-4 space-y-6">

          {/* Backend invitation panel */}
          {isInviting && (
            <div className="bg-bg-card border border-instagram-pink rounded-2xl p-6 shadow-md space-y-4 animate-scale-up">
              <div className="flex items-center justify-between border-b border-border-primary pb-2.5">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-instagram-pink" />
                  <span>Invite User to Organization</span>
                </h3>
                <button
                  onClick={() => setIsInviting(false)}
                  className="p-1 hover:bg-bg-hover rounded-lg text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendInvitation} className="space-y-4">
                {inviteError ? (
                  <p className="text-[11px] text-red-500 font-medium">{inviteError}</p>
                ) : null}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Alex Johnson"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2 text-xs focus:border-instagram-pink outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@agency.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2 text-xs focus:border-instagram-pink outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as InvitableRole)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-2 text-xs focus:border-instagram-pink outline-none"
                  >
                    {invitableRoles.map((role) => (
                      <option key={role} value={role}>
                        {formatOrganizationRole(role)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="w-full bg-instagram-pink text-white py-2 rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer mt-2 disabled:opacity-60"
                >
                  {inviteMutation.isPending ? 'Sending Invite...' : 'Send Invitation'}
                </button>
              </form>
            </div>
          )}
          
          {/* Create Modal Panel (Render inline for clean wireframe experience) */}
          {isCreating && (
            <div className="bg-bg-card border border-instagram-pink rounded-2xl p-6 shadow-md space-y-4 animate-scale-up">
              <div className="flex items-center justify-between border-b border-border-primary pb-2.5">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-instagram-pink" />
                  <span>Create Client Portal</span>
                </h3>
                <button 
                  onClick={() => setIsCreating(false)}
                  className="p-1 hover:bg-bg-hover rounded-lg text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Robert Acme"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2 text-xs focus:border-instagram-pink outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">Client Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="robert@acme.com"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2 text-xs focus:border-instagram-pink outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">Assigned Workspace *</label>
                  <select
                    value={createWorkspaceId}
                    onChange={(e) => setCreateWorkspaceId(e.target.value)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-2 text-xs focus:border-instagram-pink outline-none"
                  >
                    {state.workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>{ws.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">Subscription Plan</label>
                  <select
                    value={createPlan}
                    onChange={(e) => setCreatePlan(e.target.value as any)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-2 text-xs focus:border-instagram-pink outline-none"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">Access Expiry Date</label>
                  <input
                    type="date"
                    value={createExpiresAt}
                    onChange={(e) => setCreateExpiresAt(e.target.value)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2 text-xs focus:border-instagram-pink outline-none"
                  />
                  <span className="text-[9px] text-text-secondary italic">Leave blank for infinite access.</span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-instagram-pink text-white py-2 rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer mt-2"
                >
                  Create & Send Invite Email
                </button>
              </form>
            </div>
          )}

          {/* Edit Modal Panel (Render inline for clean wireframe experience) */}
          {isEditing && (
            <div className="bg-bg-card border border-[#262626] rounded-2xl p-6 shadow-md space-y-4 animate-scale-up">
              <div className="flex items-center justify-between border-b border-border-primary pb-2.5">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-instagram-pink" />
                  <span>Edit Client Details</span>
                </h3>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setCurrentClientId(null);
                  }}
                  className="p-1 hover:bg-bg-hover rounded-lg text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">Client Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2 text-xs focus:border-instagram-pink outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">Client Email</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2 text-xs focus:border-instagram-pink outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">Portal Password</label>
                  <input
                    type="text"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2 text-xs focus:border-instagram-pink outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">Assigned Workspace</label>
                  <select
                    value={formWorkspaceId}
                    onChange={(e) => setFormWorkspaceId(e.target.value)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-2 text-xs focus:border-instagram-pink outline-none"
                  >
                    {state.workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>{ws.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">Subscription Plan</label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value as any)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-2 text-xs focus:border-instagram-pink outline-none"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">Access Expiry Date</label>
                  <input
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2 text-xs focus:border-instagram-pink outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-text-secondary">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3 py-2 text-xs focus:border-instagram-pink outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#262626] text-white py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer mt-2"
                >
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {/* Simulated PressForge Client Inbox */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-border-primary pb-2 flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-instagram-pink uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                <span>Simulated Client Inbox</span>
              </h3>
            </div>
            <p className="text-[10px] text-text-secondary mt-1 leading-normal">
              Intercept client invitation notifications. Expired client access accounts will trigger redwarnings on login attempts.
            </p>

            <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
              {(state.mockInbox || []).map((email) => {
                const clientObj = email.to
                  ? state.clients.find((c) => c.email.toLowerCase() === email.to!.toLowerCase())
                  : undefined;
                const isClientExpired = clientObj ? getComputedStatus(clientObj) === 'expired' : false;
                
                return (
                  <div key={email.id} className="border border-border-primary rounded-xl p-3 bg-bg-app/20 text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-border-primary pb-1.5">
                      <span className="font-bold text-text-primary text-[11px] truncate">To: {email.to}</span>
                      <span className="text-[9px] text-text-secondary font-medium">Just now</span>
                    </div>
                    <p className="font-semibold text-text-primary text-[11px]">{email.subject}</p>
                    <p className="text-[10px] text-text-secondary whitespace-pre-wrap leading-normal bg-bg-card border border-border-primary rounded p-2 font-mono">
                      {email.body}
                    </p>
                    
                    {isClientExpired ? (
                      <div className="w-full flex items-center justify-center gap-1.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 py-1.5 rounded-lg text-[10px] font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Cannot Login: Plan Expired</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => email.to && handleAcceptInviteSimulated(email.to, '', email.id)}
                        className="w-full flex items-center justify-center gap-1 bg-green-500 text-white font-bold py-1.5 rounded-lg text-[10px] hover:bg-green-600 transition cursor-pointer mt-1"
                      >
                        <span>Accept Invite & Simulate Login</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              {(state.mockInbox || []).length === 0 && (
                <div className="text-center py-6 text-text-secondary italic text-[11px]">
                  No simulated emails generated. Invite a client to trigger a notification.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

