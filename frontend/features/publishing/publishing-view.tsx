'use client';

import { useAppState } from '@/lib/queries/use-app-state';
import React, { useState } from 'react';
import { Send, CheckCircle2, AlertTriangle, Calendar, Clock, RefreshCw, Instagram, Linkedin } from 'lucide-react';



export function PublishingView() {
  const { state, updateDraft } = useAppState();
  const [activeTab, setActiveTab] = useState<'scheduled' | 'logs'>('scheduled');
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const activeWorkspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId) || state.workspaces[0];

  const drafts = state.drafts.filter((d) => d.workspaceId === state.activeWorkspaceId);

  // Scheduled posts (status: approved)
  const scheduledPosts = drafts.filter((d) => d.status === 'approved');

  // Published logs (status: published)
  const publishedLogs = drafts.filter((d) => d.status === 'published');

  const handlePublishNow = (draftId: string) => {
    setPublishingId(draftId);
    setTimeout(() => {
      const draftToPublish = drafts.find((d) => d.id === draftId);
      if (draftToPublish) {
        updateDraft({
          ...draftToPublish,
          status: 'published',
          scheduledAt: new Date().toISOString()
        });
      }
      setPublishingId(null);
      alert('Post successfully published to connected channels!');
    }, 800); // 800ms mock network request
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-border-primary pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Publishing Hub</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage scheduled publication pipelines and review API connection logs.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="bg-bg-app p-1 rounded-xl flex items-center border border-border-primary self-start sm:self-center">
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 ${
              activeTab === 'scheduled' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Scheduled Queue ({scheduledPosts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 ${
              activeTab === 'logs' ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Publishing Logs ({publishedLogs.length + 1})</span> {/* +1 for the mock error case */}
          </button>
        </div>
      </div>

      {/* Scheduled Queue View */}
      {activeTab === 'scheduled' && (
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-text-primary border-b border-border-primary pb-2">Approved Queue</h3>

          <div className="flex flex-col gap-4">
            {scheduledPosts.map((post) => (
              <div
                key={post.id}
                className="border border-border-primary rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-bg-app/50 transition relative overflow-hidden"
              >
                {publishingId === post.id && (
                  <div className="absolute inset-0 bg-bg-card/70 backdrop-blur-sm z-10 flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 text-instagram-pink animate-spin" />
                    <span className="text-xs font-bold text-text-primary">Publishing post to API...</span>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-bg-app flex items-center justify-center text-text-secondary shrink-0 mt-0.5">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-text-primary">{post.prompt}</h4>
                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{post.caption}</p>
                    <div className="flex items-center gap-3 pt-2 text-[10px] text-text-secondary font-semibold">
                      <span className="flex items-center gap-1">
                        <Instagram className="w-3 h-3 text-instagram-pink" /> Instagram
                      </span>
                      <span className="flex items-center gap-1">
                        <Linkedin className="w-3 h-3 text-blue-600" /> LinkedIn
                      </span>
                      <span className="text-slate-300">|</span>
                      <span>Scheduled: {post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString() : 'Pending'}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <button
                    onClick={() => handlePublishNow(post.id)}
                    className="flex items-center gap-1.5 bg-[#262626] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-800 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Now</span>
                  </button>
                </div>
              </div>
            ))}

            {scheduledPosts.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <Calendar className="w-8 h-8 text-slate-200 mx-auto" />
                <p className="text-sm font-bold text-slate-400 italic">No posts scheduled in the queue.</p>
                <p className="text-xs text-text-secondary">Go generate an AI draft and get client approval to queue it.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logs View */}
      {activeTab === 'logs' && (
        <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-text-primary border-b border-border-primary pb-2">Publishing Status Logs</h3>

          <div className="flex flex-col gap-4">
            {/* Dynamic list */}
            {publishedLogs.map((log) => (
              <div
                key={log.id}
                className="border border-border-primary rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-app/30"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-text-primary">{log.prompt}</h4>
                      <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">
                        Published (API Success)
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-1 italic">"{log.caption}"</p>
                    <p className="text-[9px] text-text-secondary font-semibold mt-1">
                      Published: {log.scheduledAt ? new Date(log.scheduledAt).toLocaleString() : 'Just now'}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Static Mock Error Log Case */}
            <div className="border border-red-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-red-50/10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-text-primary">Organic cotton launch teaser (Legacy)</h4>
                    <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
                      Connection Timeout (HTTP 504)
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-1 italic">"We are excited to share a peek..."</p>
                  <p className="text-[9px] text-text-secondary font-semibold mt-1">
                    Attempted: 2026-06-16 11:34:02
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => alert('Simulating publication retry... Success!')}
                  className="flex items-center gap-1 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 px-3.5 py-1.5 rounded-full text-xs font-bold transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry API Publish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

