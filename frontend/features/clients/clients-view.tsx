'use client';

import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import { useAuth } from '@/lib/hooks/queries/use-auth';
import { useInviteMemberMutation } from '@/lib/hooks/mutations/use-invitation';
import { ApiError } from '@/lib/utils/api-errors';
import React, { useState } from 'react';
import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { Skeleton } from '@/components/common/skeleton';
import { Select } from '@/components/common/select';
import { DeleteModal } from '@/components/common/delete-modal';
import { InfiniteScroll } from '@/components/common/infinite-scroll';
import { 
  Users, Mail, ArrowRight, ShieldAlert, Building, X, Plus, 
  Trash2, Calendar, ShieldCheck, UserCheck, AlertTriangle, 
  Filter, Search, Key
} from 'lucide-react';

export function ClientsView() {
  const { state, refetch: refetchAppState } = useAppState();
  const { user } = useAuth();
  const organizationId = user?.organizationId ?? null;
  const inviteMutation = useInviteMemberMutation(organizationId ?? '');
  const router = useRouter();

  const isClient = state.currentUserType === 'client';
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Backend invitation form
  const [isInviting, setIsInviting] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('');
  const [inviteError, setInviteError] = useState('');
  const [deleteInviteId, setDeleteInviteId] = useState<string | null>(null);

  // Fetch Invitable Roles from Backend
  const { data: invitableRoles = [], isLoading: isRolesLoading } = useQuery({
    queryKey: ['invitable-roles', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const res = await fetch(`/api/organizations/${organizationId}/invitable-roles`);
      if (!res.ok) throw new Error('Failed to fetch invitable roles');
      return res.json() as Promise<{ value: string; label: string }[]>;
    },
    enabled: Boolean(organizationId),
  });

  const canInvite = Boolean(organizationId) && (isRolesLoading || invitableRoles.length > 0);

  // Fetch ALL Clients (for stats cards)
  const { data: allClients = [], refetch: refetchAllClients } = useQuery({
    queryKey: ['all-clients', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const res = await fetch(`/api/organizations/${organizationId}/clients`);
      if (!res.ok) throw new Error('Failed to fetch clients');
      return res.json() as Promise<any[]>;
    },
    enabled: Boolean(organizationId),
  });

  // Fetch Filtered Clients from Backend with Infinite Scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isClientsLoading,
    refetch: refetchClients,
  } = useInfiniteQuery({
    queryKey: ['clients', organizationId, debouncedSearchTerm, selectedPlanFilter, selectedStatusFilter, selectedRoleFilter],
    queryFn: async ({ pageParam = 0 }) => {
      if (!organizationId) return [];
      const queryParams = new URLSearchParams();
      if (debouncedSearchTerm) queryParams.set('search', debouncedSearchTerm);
      if (selectedPlanFilter !== 'all') queryParams.set('plan', selectedPlanFilter);
      if (selectedStatusFilter !== 'all') queryParams.set('status_filter', selectedStatusFilter);
      if (selectedRoleFilter !== 'all') queryParams.set('role_filter', selectedRoleFilter);
      queryParams.set('skip', String(pageParam));
      queryParams.set('limit', '10'); // Fetch 10 items at a time

      const res = await fetch(`/api/organizations/${organizationId}/clients?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch clients');
      return res.json() as Promise<any[]>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const LIMIT = 10;
      if (lastPage.length < LIMIT) return undefined;
      const totalLoaded = allPages.reduce((sum, page) => sum + page.length, 0);
      return totalLoaded;
    },
    enabled: Boolean(organizationId),
  });

  const clients = data ? data.pages.flatMap((page) => page) : [];

  // Fetch Supported Plans from Backend
  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await fetch('/api/plans');
      if (!res.ok) throw new Error('Failed to fetch plans');
      return res.json() as Promise<string[]>;
    },
  });

  // Delete Invitation Mutation
  const deleteInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      if (!organizationId) return;
      const res = await fetch(`/api/organizations/${organizationId}/invitations/${invitationId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete invitation');
      }
    },
    onSuccess: () => {
      refetchClients();
      refetchAllClients();
      refetchAppState();
      notifications.show({
        title: 'Invitation deleted',
        message: 'The pending invitation has been removed.',
        color: 'green',
      });
    },
    onError: (error) => {
      notifications.show({
        title: 'Deletion failed',
        message: error.message,
        color: 'red',
      });
    },
  });

  const selectedInviteRole = inviteRole || (invitableRoles[0]?.value ?? '');

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
      await inviteMutation.mutateAsync({
        email: inviteEmail.trim(),
        fullName: inviteName.trim(),
        role: selectedInviteRole as any,
      });

      refetchClients();
      refetchAllClients();
      refetchAppState();
      setInviteName('');
      setInviteEmail('');
      setInviteRole(invitableRoles[0]?.value ?? '');
      setIsInviting(false);

      notifications.show({
        title: 'Invitation sent',
        message: `An invite email was sent to ${inviteEmail.trim()}.`,
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

  // Helper: check if a client subscription has expired
  const getComputedStatus = (client: any) => {
    if (client.status === 'expired') return 'expired';
    if (client.expiresAt && new Date(client.expiresAt) < new Date()) {
      return 'expired';
    }
    return client.status;
  };

  // Filter & Search Logic is now handled on the backend API side.
  const filteredClients = clients;

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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-card border border-border-primary rounded-xl p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-text-secondary">Total Users</span>
          <p className="text-2xl font-extrabold text-text-primary mt-1">{allClients.length}</p>
        </div>
        <div className="bg-bg-card border border-border-primary rounded-xl p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-text-secondary">Active Access</span>
          <p className="text-2xl font-extrabold text-green-600 mt-1">
            {allClients.filter(c => getComputedStatus(c) === 'active').length}
          </p>
        </div>
        <div className="bg-bg-card border border-border-primary rounded-xl p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-text-secondary">Pending Invites</span>
          <p className="text-2xl font-extrabold text-yellow-600 mt-1">
            {allClients.filter(c => getComputedStatus(c) === 'pending').length}
          </p>
        </div>
        <div className="bg-bg-card border border-border-primary rounded-xl p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-text-secondary">Expired Subscriptions</span>
          <p className="text-2xl font-extrabold text-red-500 mt-1">
            {allClients.filter(c => getComputedStatus(c) === 'expired').length}
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-bg-card border border-border-primary rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by email"
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
          <Select
            value={selectedPlanFilter}
            onChange={(e) => setSelectedPlanFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Plans' },
              ...plans.map((p: string) => ({ value: p, label: p }))
            ]}
            className="py-1.5 px-3 text-xs"
            containerClassName="w-36"
          />

          {/* Status Filter */}
          <Select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'expired', label: 'Expired' }
            ]}
            className="py-1.5 px-3 text-xs"
            containerClassName="w-36"
          />

          {/* Role Filter */}
          <Select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Roles' },
              { value: 'ADMIN', label: 'Admin' },
              { value: 'MEMBER', label: 'Member' },
              { value: 'CLIENT', label: 'Client' },
              { value: 'OWNER', label: 'Owner' }
            ]}
            className="py-1.5 px-3 text-xs"
            containerClassName="w-36"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main List Column */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Client List */}
          <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-text-primary border-b border-border-primary pb-2 flex items-center gap-1.5">
              <Users className="w-5 h-5 text-instagram-pink" />
              <span>Registered Users</span>
            </h3>

            <div className="max-h-[530px] overflow-y-auto pr-1">
              <InfiniteScroll
                hasMore={hasNextPage}
                onLoadMore={fetchNextPage}
                isLoading={isFetchingNextPage}
              >
                <div className="grid grid-cols-1 gap-4 pr-1">
                  {isClientsLoading ? (
                    <div className="flex flex-col gap-4 animate-pulse">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="border border-border-primary rounded-2xl p-5 bg-bg-app/40 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-2.5 w-full max-w-md">
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-4 w-14" />
                                <Skeleton className="h-4 w-18" />
                              </div>
                              <Skeleton className="h-4 w-40" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-lg" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    filteredClients.map((client) => {
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
                          : 'bg-bg-app border-border-primary text-text-secondary';

                      const getRoleBadgeStyles = (role: string) => {
                        const normalized = role?.toUpperCase();
                        if (normalized === 'OWNER') {
                          return 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:border-purple-900 dark:text-purple-400';
                        }
                        if (normalized === 'ADMIN') {
                          return 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400';
                        }
                        if (normalized === 'MEMBER') {
                          return 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-400';
                        }
                        return 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400';
                      };

                      return (
                        <div key={client.id} className="border border-border-primary rounded-xl p-5 bg-bg-app/20 hover:border-instagram-pink/40 transition duration-150 flex flex-col justify-between gap-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            
                            {/* Left: Info */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-extrabold text-base text-text-primary">{client.name}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${statusStyles}`}>
                                  {computedStatus}
                                </span>
                                {client.role && (
                                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${getRoleBadgeStyles(client.role)}`}>
                                    {client.role}
                                  </span>
                                )}
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

                            {/* Actions */}
                            <div className="flex items-center gap-2 self-end sm:self-start">
                              {!client.isAccepted && (
                                <button
                                  onClick={() => setDeleteInviteId(client.id)}
                                  disabled={deleteInviteMutation.isPending}
                                  title="Delete Pending Invitation"
                                  className="p-2 border border-border-primary bg-bg-card rounded-lg hover:border-red-500 hover:text-red-500 transition text-text-secondary disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>


                        </div>
                      );
                    })
                  )}

                  {!isClientsLoading && filteredClients.length === 0 && (
                    <div className="text-center py-12 text-text-secondary italic text-sm">
                      No clients match the selected search or filter criteria.
                    </div>
                  )}
                </div>
              </InfiniteScroll>
            </div>
          </div>
        </div>

        {/* Right Panel: Side Forms / Inbox */}
        <div className="lg:col-span-4 space-y-6">

          {/* Backend invitation panel */}
          <div className="bg-bg-card border border-instagram-pink rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-border-primary pb-2.5">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-instagram-pink" />
                <span>Invite User to Organization</span>
              </h3>
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
                <Select
                  label="Role"
                  value={selectedInviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  options={invitableRoles.map((role) => ({
                    value: role.value,
                    label: role.label
                  }))}
                  className="py-2 text-xs"
                />
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
        </div>
      </div>

      <DeleteModal
        isOpen={deleteInviteId !== null}
        onClose={() => setDeleteInviteId(null)}
        onConfirm={async () => {
          if (deleteInviteId) {
            await deleteInviteMutation.mutateAsync(deleteInviteId);
            setDeleteInviteId(null);
          }
        }}
        isPending={deleteInviteMutation.isPending}
        title="Delete Invitation"
        description="Are you sure you want to delete/cancel this pending invitation? The invite link will be invalidated."
        confirmLabel="Delete Invitation"
      />
    </div>
  );
}


