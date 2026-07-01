'use client';

import Link from 'next/link';
import { useAppState } from '@/lib/queries/use-app-state';
import React, { useState } from 'react';
import { List, Sparkles, Instagram, Plus, Linkedin } from 'lucide-react';

export function ContentListView() {
  const { state } = useAppState();
  const [listTab, setListTab] = useState<'all' | 'draft' | 'pending' | 'approved' | 'published'>('all');

  // Filter drafts for current workspace
  const workspaceDrafts = state.drafts.filter((d) => d.workspaceId === state.activeWorkspaceId);

  // Filter list by tab
  const filteredDrafts = workspaceDrafts.filter((d) => {
    if (listTab === 'all') return true;
    if (listTab === 'draft') return d.status === 'draft' || d.status === 'rejected';
    if (listTab === 'pending') return d.status === 'pending_approval';
    if (listTab === 'approved') return d.status === 'approved';
    if (listTab === 'published') return d.status === 'published';
    return true;
  });

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

      {/* List View */}
      <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-6">
        {/* Sub tabs */}
        <div className="flex flex-wrap gap-1 border-b border-border-primary pb-3">
          {[
            { id: 'all', label: 'All Drafts' },
            { id: 'draft', label: 'Drafts' },
            ...(state.accountType !== 'individual' ? [{ id: 'pending', label: 'Pending Approval' }] : []),
            { id: 'approved', label: 'Scheduled' },
            { id: 'published', label: 'Published' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setListTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                listTab === tab.id
                  ? 'bg-bg-app border border-border-primary text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-hidden border border-border-primary rounded-xl">
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
              {filteredDrafts.map((draft) => (
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
                      href={draft.status === 'pending_approval' ? `/app/approvals/${draft.id}` : `/app/content/${draft.id}`}
                      className="text-xs font-bold text-instagram-pink hover:underline"
                    >
                      Open details
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredDrafts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-text-secondary italic">
                    No drafts match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

