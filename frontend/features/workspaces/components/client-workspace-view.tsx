'use client';

import Link from 'next/link';
import { Plus, ExternalLink, Calendar, FileText, Users, Globe } from 'lucide-react';
import type { Workspace, ClientUser } from '@/lib/types';

interface ClientWorkspaceViewProps {
  currentWorkspace: Workspace;
  allocatedClients: ClientUser[];
  currentUserEmail: string | null;
}

export function ClientWorkspaceView({
  currentWorkspace,
  allocatedClients,
  currentUserEmail,
}: ClientWorkspaceViewProps) {
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

        {/* <Link 
          href="/app/content/new"
          className="bg-instagram-pink text-white hover:opacity-90 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Post</span>
        </Link> */}
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
                  {currentWorkspace?.website && (
                    <a 
                      href={currentWorkspace.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-instagram-pink hover:opacity-85"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
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
              {(currentWorkspace?.schedules || []).length === 0 && (
                <p className="text-xs text-text-secondary italic">No schedules configured for this workspace.</p>
              )}

              {(currentWorkspace?.schedules || []).map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 bg-bg-app/30 border border-border-primary rounded-lg px-3 py-2 text-xs">
                  <div>
                    <div className="font-bold text-text-primary">{s.label}</div>
                    <div className="text-[11px] text-text-secondary">{s.nextRun ? new Date(s.nextRun).toLocaleString() : (s.datetime ? new Date(s.datetime).toLocaleString() : '—')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-[11px] text-text-secondary">{s.recurrence || 'one-time'}</div>
                  </div>
                </div>
              ))}
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
                  <p className="font-bold text-text-primary">{client.name} {client.id === currentUserEmail && '(You)'}</p>
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
