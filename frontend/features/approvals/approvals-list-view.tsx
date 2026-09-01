'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import {
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Instagram,
  Linkedin,
  Loader2,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { useAppState } from '@/lib/queries/use-app-state';
import { useAuth } from '@/lib/hooks/queries/use-auth';
import { usePaginatedDrafts } from '@/lib/hooks/queries/use-paginated-drafts';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';

export function ApprovalsListView() {
  const { state } = useAppState();
  const { user } = useAuth();
  const isClient = user?.userType === 'client' || state.currentUserType === 'client';
  const isIndividual =
    user?.userType === 'individual' ||
    state.currentUserType === 'individual' ||
    state.accountType === 'individual';
  const canApprove = isClient || isIndividual;

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState<string>('');
  const [platform, setPlatform] = useState<string>('all');
  const [page, setPage] = useState<number>(1);

  const handleTabChange = (newTab: 'pending' | 'approved' | 'rejected') => {
    setActiveTab(newTab);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlatform(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setPlatform('all');
    setPage(1);
  };

  // Map activeTab to status filter string for backend
  const backendStatusFilter =
    activeTab === 'pending'
      ? 'pending_approval'
      : activeTab === 'approved'
      ? 'approved_all'
      : 'rejected';

  const {
    drafts: visibleDrafts,
    total,
    totalPages,
    counts,
    isLoading,
    isFetching,
  } = usePaginatedDrafts({
    workspaceId: state.activeWorkspaceId,
    status: backendStatusFilter,
    search,
    platform,
    page,
    limit: 10,
  });

  const isFiltered = Boolean(search.trim() || platform !== 'all');

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-primary pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {isClient || isIndividual ? 'My Approvals' : 'Client Approvals'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {isClient || isIndividual
              ? 'Review and approve posts generated for your workspace.'
              : 'Review posts currently sent to client phone preview, or inspect approvals history.'}
          </p>
        </div>
        {isFetching && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-instagram-pink" />
            <span>Syncing...</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => handleTabChange('pending')}
          className={`border p-4.5 rounded-2xl text-left transition cursor-pointer ${
            activeTab === 'pending'
              ? 'border-yellow-400 bg-yellow-50/20 shadow-sm'
              : 'border-border-primary bg-bg-card hover:bg-bg-app'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">
              {isClient ? 'Awaiting My Approval' : isIndividual ? 'Awaiting Approval' : 'Awaiting Client'}
            </span>
            <AlertCircle className="w-4.5 h-4.5 text-yellow-500" />
          </div>
          <p className="text-2xl font-extrabold text-text-primary mt-2">{counts.pending}</p>
        </button>

        <button
          onClick={() => handleTabChange('approved')}
          className={`border p-4.5 rounded-2xl text-left transition cursor-pointer ${
            activeTab === 'approved'
              ? 'border-green-400 bg-green-50/20 shadow-sm'
              : 'border-border-primary bg-bg-card hover:bg-bg-app'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">
              {isClient ? 'Approved by Me' : 'Approved & Scheduled'}
            </span>
            <CheckCircle2 className="w-4.5 h-4.5 text-green-500" />
          </div>
          <p className="text-2xl font-extrabold text-text-primary mt-2">{counts.approved}</p>
        </button>

        <button
          onClick={() => handleTabChange('rejected')}
          className={`border p-4.5 rounded-2xl text-left transition cursor-pointer ${
            activeTab === 'rejected'
              ? 'border-red-400 bg-red-50/20 shadow-sm'
              : 'border-border-primary bg-bg-card hover:bg-bg-app'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">
              {isClient ? 'Feedback Sent / Rejected' : 'Feedback / Rejected'}
            </span>
            <XCircle className="w-4.5 h-4.5 text-red-500" />
          </div>
          <p className="text-2xl font-extrabold text-text-primary mt-2">{counts.rejected}</p>
        </button>
      </div>

      {/* Backend Driven Filter Bar */}
      <div className="bg-bg-card border border-border-primary rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Filter by keyword, topic, or caption..."
            className="w-full bg-bg-app border border-border-primary rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-instagram-pink"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All Platforms' },
              { value: 'instagram', label: 'Instagram' },
              { value: 'linkedin', label: 'LinkedIn' },
            ]}
            icon={<Filter className="w-3.5 h-3.5" />}
            variant="compact"
            containerClassName="w-full sm:w-44"
          />

          {isFiltered && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Listing card */}
      <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-text-primary border-b border-border-primary pb-2">
          {activeTab === 'pending'
            ? (isClient ? 'Awaiting My Approval' : isIndividual ? 'Pending Approvals' : 'Pending Approvals')
            : activeTab === 'approved'
            ? (isClient ? 'Approved by Me' : 'Approved & Scheduled')
            : (isClient ? 'Feedback Sent / Rejected' : 'Feedback / Rejected')}
        </h3>

        <div className="flex flex-col gap-4">
          {visibleDrafts.map((draft) => (
            <div
              key={draft.id}
              className="border border-border-primary rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-bg-app/50 transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] flex items-center justify-center text-white text-xs font-extrabold shrink-0 mt-0.5">
                  {draft.prompt ? draft.prompt.charAt(0) : 'P'}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-text-primary">{draft.prompt}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold">v{draft.version ?? 1}</span>
                    {(() => {
                      const revCount = (draft.history ?? []).filter((h) => h.action === 'Client Requested Changes').length;
                      return revCount > 0 ? (
                        <span className="text-[10px] font-bold text-purple-500 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-full">
                          {revCount} revision{revCount !== 1 ? 's' : ''}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{draft.caption}</p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <Instagram className="w-3.5 h-3.5 text-instagram-pink" />
                    <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3 self-end sm:self-center">
                {activeTab === 'pending' && canApprove ? (
                  <Link
                    href={`/app/approvals/${draft.id}`}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-[#F58529] to-[#DD2A7B] text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-95 transition shadow-xs whitespace-nowrap cursor-pointer"
                  >
                    <span>Review & Approve</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </Link>
                ) : (
                  <Link
                    href={canApprove ? `/app/approvals/${draft.id}` : `/app/content/${draft.id}`}
                    className="text-xs font-bold text-text-secondary hover:text-text-primary hover:underline py-2 whitespace-nowrap cursor-pointer"
                  >
                    View History
                  </Link>
                )}
              </div>
            </div>
          ))}

          {visibleDrafts.length === 0 && !isLoading && (
            <div className="text-center py-10 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-200 mx-auto" />
              <p className="text-sm font-bold text-slate-400 italic">No posts match this filter.</p>
            </div>
          )}
        </div>

        {/* Reusable Pagination Component */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={10}
          onPageChange={(newPage) => setPage(newPage)}
          isLoading={isLoading || isFetching}
        />
      </div>
    </div>
  );
}
