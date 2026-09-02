'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { Sparkles, Instagram, Linkedin, Loader2, Search, Filter, X } from 'lucide-react';
import { useAppState } from '@/lib/queries/use-app-state';
import { useAuth } from '@/lib/hooks/queries/use-auth';
import { usePaginatedDrafts } from '@/lib/hooks/queries/use-paginated-drafts';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';

export function ContentListView() {
  const { state } = useAppState();
  const { user } = useAuth();
  const isClient = user?.userType === 'client' || state.currentUserType === 'client';
  const isIndividual =
    user?.userType === 'individual' ||
    state.currentUserType === 'individual' ||
    state.accountType === 'individual';
  const canApprove = isClient || isIndividual;

  const [listTab, setListTab] = useState<'all' | 'draft' | 'pending' | 'approved' | 'published'>('all');
  const [search, setSearch] = useState<string>('');
  const [platform, setPlatform] = useState<string>('all');
  const [page, setPage] = useState<number>(1);

  const handleTabChange = (newTab: 'all' | 'draft' | 'pending' | 'approved' | 'published') => {
    setListTab(newTab);
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

  const {
    drafts,
    total,
    totalPages,
    isLoading,
    isFetching,
    isTabLoading,
  } = usePaginatedDrafts({
    workspaceId: state.activeWorkspaceId,
    status: listTab,
    search,
    platform,
    page,
    limit: 10,
  });

  const isFiltered = Boolean(search.trim() || platform !== 'all');

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-text-primary">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-primary pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Content Planner</h1>
          <p className="text-sm text-text-secondary mt-1">
            Review, draft, and organize your marketing posts for social channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/content/new"
            className="flex items-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white px-4 py-2 rounded-full text-xs font-semibold hover:opacity-95 transition shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Draft</span>
          </Link>
        </div>
      </div>

      {/* Backend Driven Filter Bar */}
      <div className="bg-bg-card border border-border-primary rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search content brief or caption..."
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

      {/* List View */}
      <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-6">
        {/* Sub tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-border-primary pb-3 overflow-x-auto">
          <div className="flex gap-1 overflow-x-auto flex-nowrap">
            {[
              { id: 'all', label: 'All Drafts' },
              { id: 'draft', label: 'Drafts' },
              { id: 'pending', label: 'Pending Approval' },
              { id: 'approved', label: 'Scheduled' },
              { id: 'published', label: 'Published' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as 'pending' | 'draft' | 'approved' | 'published' | 'all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                  listTab === tab.id
                    ? 'bg-bg-app border border-border-primary text-text-primary shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {isFetching && (
            <div className="flex items-center gap-1.5 text-xs text-text-secondary shrink-0">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-instagram-pink" />
              <span>Syncing...</span>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-border-primary rounded-xl relative">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-bg-app border-b border-border-primary text-[10px] font-bold text-text-secondary tracking-wide uppercase">
                <th className="p-4">Content Brief</th>
                <th className="p-4">Social Caption</th>
                <th className="p-4">Platform</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {isTabLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-4 bg-border-primary/60 rounded w-28" /></td>
                    <td className="p-4"><div className="h-3 bg-border-primary/40 rounded w-48" /></td>
                    <td className="p-4"><div className="h-4 bg-border-primary/40 rounded w-16" /></td>
                    <td className="p-4"><div className="h-4 bg-border-primary/40 rounded w-20" /></td>
                    <td className="p-4 text-right"><div className="h-4 bg-border-primary/40 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                drafts.map((draft) => (
                  <tr key={draft.id} className="hover:bg-bg-hover transition">
                    <td className="p-4 font-semibold text-xs text-text-primary max-w-[200px] truncate">
                      {draft.prompt}
                    </td>
                    <td className="p-4 text-xs text-text-secondary max-w-[350px] truncate">
                      {draft.caption}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(!draft.platform || draft.platform === 'instagram' || draft.platform === 'both') && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-instagram-pink bg-pink-500/10 px-2 py-0.5 rounded-full font-bold">
                            <Instagram className="w-3 h-3" /> Instagram
                          </span>
                        )}
                        {(draft.platform === 'linkedin' || draft.platform === 'both') && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full font-bold">
                            <Linkedin className="w-3 h-3" /> LinkedIn
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          draft.status === 'approved'
                            ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900'
                            : draft.status === 'pending_approval'
                            ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900'
                            : draft.status === 'rejected'
                            ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900'
                            : 'bg-bg-app border border-border-primary text-text-secondary'
                        }`}
                      >
                        {draft.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right shrink-0">
                      <Link
                        href={draft.status === 'pending_approval' && canApprove ? `/app/approvals/${draft.id}` : `/app/content/${draft.id}`}
                        className="text-xs font-bold text-instagram-pink hover:underline"
                      >
                        Open details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
              {drafts.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-text-secondary italic">
                    No drafts match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
